const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, User, StudentProfile, TeacherProfile, Subject, TeachingSession, TutorRequest } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { createNotification } = require('../services/notificationService');
const { emitToUser, emitToClassroom } = require('../socket');

const getTeacherProfileForUser = async (userId) => {
  let profile = await TeacherProfile.findOne({ where: { userId } });
  if (!profile) profile = await TeacherProfile.create({ userId, teacherId: `TCH${String(userId).padStart(3, '0')}${Date.now().toString().slice(-4)}` });
  return profile;
};

const resolveStudent = async (studentId) => {
  const where = !isNaN(Number(studentId))
    ? { [Op.or]: [{ id: Number(studentId) }, { studentId: String(studentId) }] }
    : { studentId: String(studentId) };
  return StudentProfile.findOne({ where, include: [{ model: User, as: 'user', attributes: ['id', 'name', 'isActive'] }] });
};

const isAuthorizedStudent = (teacher, student) => {
  if (!student) return false;
  if (teacher.className?.trim() && student.className !== teacher.className.trim()) return false;
  if (teacher.section?.trim() && student.section !== teacher.section.trim()) return false;
  return true;
};

const includeOptions = [
  { model: TeacherProfile, as: 'teacherProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
  { model: StudentProfile, as: 'studentProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
  { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
  { model: TutorRequest, as: 'bookingRequest', attributes: ['id', 'requesterUserId'] }
];

const formatSession = (session) => ({
  id: session.id,
  teacherId: session.teacherProfileId,
  teacher: session.teacherProfile?.user?.name || '',
  studentId: session.studentProfileId,
  student: session.studentProfile?.user?.name || '',
  subjectId: session.subjectId,
  subject: session.subject?.name || session.subjectName || '',
  title: session.title,
  description: session.description || '',
  mode: session.mode,
  scheduledDate: session.scheduledDate,
  startTime: session.startTime,
  endTime: session.endTime,
  status: session.status,
  bookingStatus: session.bookingStatus || null,
  tutorRequestId: session.tutorRequestId || null,
  cancellationReason: session.cancellationReason || '',
  location: session.location || '',
  classRoomId: session.classRoomId,
  startedAt: session.startedAt,
  completedAt: session.completedAt,
  cancelledAt: session.cancelledAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt
});

const getOwnedSession = (teacherProfileId, sessionId) => TeachingSession.findOne({ where: { id: sessionId, teacherProfileId }, include: includeOptions });
const getStudentSession = (studentProfileId, sessionId) => TeachingSession.findOne({ where: { id: sessionId, studentProfileId }, include: includeOptions });
const findScheduleConflict = ({ teacherProfileId, scheduledDate, startTime, endTime, excludeSessionId, transaction }) =>
  TeachingSession.findOne({
    where: {
      teacherProfileId,
      scheduledDate,
      status: { [Op.in]: ['SCHEDULED', 'LIVE'] },
      startTime: { [Op.lt]: endTime },
      endTime: { [Op.gt]: startTime },
      ...(excludeSessionId ? { id: { [Op.ne]: excludeSessionId } } : {})
    },
    transaction,
    lock: transaction?.LOCK?.UPDATE
  });

const notifyStudent = async (session, title, message) => {
  const recipients = new Set([session.studentProfile?.userId, session.bookingRequest?.requesterUserId]);
  for (const recipientUserId of recipients) {
    if (recipientUserId) {
      await createNotification({ recipientUserId, type: 'GENERAL', title, message, relatedEntityType: 'teaching_session', relatedEntityId: session.id });
    }
  }
};

const getPayload = (body) => ({
  studentId: body.studentId,
  subjectId: body.subjectId || null,
  title: typeof body.title === 'string' ? body.title.trim() : '',
  description: typeof body.description === 'string' ? body.description.trim() : '',
  mode: typeof body.mode === 'string' ? body.mode.toUpperCase() : '',
  scheduledDate: body.scheduledDate,
  startTime: body.startTime,
  endTime: body.endTime,
  location: typeof body.location === 'string' ? body.location.trim() : ''
});

const validatePayload = (payload) => {
  if (!payload.studentId || !payload.title || !payload.scheduledDate || !payload.startTime || !payload.endTime) return 'Student, title, date, start time, and end time are required';
  if (!['ONLINE', 'OFFLINE'].includes(payload.mode)) return 'Mode must be ONLINE or OFFLINE';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.scheduledDate)) return 'scheduledDate must use YYYY-MM-DD format';
  if (!/^\d{2}:\d{2}$/.test(payload.startTime) || !/^\d{2}:\d{2}$/.test(payload.endTime)) return 'startTime and endTime must use HH:mm format';
  if (payload.startTime >= payload.endTime) return 'End time must be after start time';
  if (payload.mode === 'OFFLINE' && !payload.location) return 'Location is required for offline sessions';
  return null;
};

const createSession = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    const payload = getPayload(req.body || {});
    const validationError = validatePayload(payload);
    if (validationError) return errorResponse(res, 400, validationError);
    const student = await resolveStudent(payload.studentId);
    if (!student || !student.user?.isActive) return errorResponse(res, 404, 'Student profile not found');
    if (!isAuthorizedStudent(teacher, student)) return errorResponse(res, 403, 'Access denied. This student is outside your authorized teaching scope.');
    let subject = null;
    if (payload.subjectId) {
      subject = await Subject.findOne({ where: { id: payload.subjectId, status: 'active' } });
      if (!subject) return errorResponse(res, 404, 'Subject not found');
    }
    const session = await sequelize.transaction(async transaction => {
      await TeacherProfile.findByPk(teacher.id, { transaction, lock: transaction.LOCK.UPDATE });
      const conflict = await findScheduleConflict({ teacherProfileId: teacher.id, ...payload, transaction });
      if (conflict) {
        const error = new Error('The tutor already has a class during this time');
        error.status = 409;
        throw error;
      }
      return TeachingSession.create({
        teacherProfileId: teacher.id, studentProfileId: student.id, subjectId: subject?.id || null, subjectName: subject?.name || '',
        title: payload.title, description: payload.description, mode: payload.mode, scheduledDate: payload.scheduledDate,
        startTime: payload.startTime, endTime: payload.endTime, location: payload.mode === 'OFFLINE' ? payload.location : '', classRoomId: `class-${crypto.randomUUID()}`
      }, { transaction });
    });
    const hydrated = await TeachingSession.findByPk(session.id, { include: includeOptions });
    const formatted = formatSession(hydrated);
    await notifyStudent(hydrated, `${payload.mode === 'ONLINE' ? 'Online' : 'Offline'} class scheduled`, `${payload.mode === 'ONLINE' ? 'Online' : 'Offline'} class scheduled for ${formatted.subject || formatted.title} at ${payload.startTime}.`);
    emitToUser(student.userId, 'session:scheduled', formatted);
    return successResponse(res, 201, 'Teaching session scheduled successfully', formatted);
  } catch (error) {
    if (error.status === 409) return errorResponse(res, 409, error.message);
    console.error('[Create Teaching Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to schedule teaching session');
  }
};

const listTeacherSessions = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    const where = { teacherProfileId: teacher.id };
    if (req.query.status) where.status = String(req.query.status).toUpperCase();
    if (req.query.mode) where.mode = String(req.query.mode).toUpperCase();
    const sessions = await TeachingSession.findAll({ where, include: includeOptions, order: [['scheduledDate', 'ASC'], ['startTime', 'ASC']] });
    return successResponse(res, 200, 'Teaching sessions retrieved successfully', { sessions: sessions.map(formatSession), count: sessions.length });
  } catch (error) {
    console.error('[List Teacher Sessions Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve teaching sessions');
  }
};

const listSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({ where: { status: 'active' }, attributes: ['id', 'name', 'code'], order: [['name', 'ASC']] });
    return successResponse(res, 200, 'Subjects retrieved successfully', subjects);
  } catch (error) {
    console.error('[List Teaching Subjects Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve subjects');
  }
};

const listStudentSessions = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ where: { userId: req.user.id } });
    if (!student) return errorResponse(res, 404, 'Student profile not found');
    const where = { studentProfileId: student.id };
    if (req.query.status) where.status = String(req.query.status).toUpperCase();
    const sessions = await TeachingSession.findAll({ where, include: includeOptions, order: [['scheduledDate', 'ASC'], ['startTime', 'ASC']] });
    return successResponse(res, 200, 'Teaching sessions retrieved successfully', { sessions: sessions.map(formatSession), count: sessions.length });
  } catch (error) {
    console.error('[List Student Sessions Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve teaching sessions');
  }
};

const getTeacherSession = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    const session = await getOwnedSession(teacher.id, req.params.sessionId);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    return successResponse(res, 200, 'Teaching session retrieved successfully', formatSession(session));
  } catch (error) {
    console.error('[Get Teacher Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve teaching session');
  }
};

const getStudentSessionDetails = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ where: { userId: req.user.id } });
    const session = student && await getStudentSession(student.id, req.params.sessionId);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    return successResponse(res, 200, 'Teaching session retrieved successfully', formatSession(session));
  } catch (error) {
    console.error('[Get Student Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve teaching session');
  }
};

const updateSession = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    const session = await getOwnedSession(teacher.id, req.params.sessionId);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    if (session.status !== 'SCHEDULED') return errorResponse(res, 409, 'Only scheduled sessions can be updated');
    if (session.tutorRequestId) return errorResponse(res, 409, 'Marketplace bookings must be rescheduled through the booking workflow');
    const payload = getPayload({ ...session.toJSON(), ...req.body, studentId: session.studentProfileId, subjectId: req.body.subjectId ?? session.subjectId });
    const validationError = validatePayload(payload);
    if (validationError) return errorResponse(res, 400, validationError);
    if (payload.subjectId) {
      const subject = await Subject.findOne({ where: { id: payload.subjectId, status: 'active' } });
      if (!subject) return errorResponse(res, 404, 'Subject not found');
      session.subjectId = subject.id;
      session.subjectName = subject.name;
    } else {
      session.subjectId = null;
      session.subjectName = '';
    }
    await sequelize.transaction(async transaction => {
      await TeacherProfile.findByPk(teacher.id, { transaction, lock: transaction.LOCK.UPDATE });
      const conflict = await findScheduleConflict({
        teacherProfileId: teacher.id,
        scheduledDate: payload.scheduledDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        excludeSessionId: session.id,
        transaction
      });
      if (conflict) {
        const error = new Error('The tutor already has a class during this time');
        error.status = 409;
        throw error;
      }
      Object.assign(session, { title: payload.title, description: payload.description, mode: payload.mode, scheduledDate: payload.scheduledDate, startTime: payload.startTime, endTime: payload.endTime, location: payload.mode === 'OFFLINE' ? payload.location : '' });
      await session.save({ transaction });
      return true;
    });
    const hydrated = await getOwnedSession(teacher.id, session.id);
    return successResponse(res, 200, 'Teaching session updated successfully', formatSession(hydrated));
  } catch (error) {
    if (error.status === 409) return errorResponse(res, 409, error.message);
    console.error('[Update Teaching Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update teaching session');
  }
};

const cancelSession = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    const session = await getOwnedSession(teacher.id, req.params.sessionId);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    if (['COMPLETED', 'CANCELLED'].includes(session.status)) return errorResponse(res, 409, 'Session cannot be cancelled in its current state');
    session.status = 'CANCELLED';
    if (session.tutorRequestId) session.bookingStatus = 'CANCELLED';
    session.cancellationReason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    session.cancelledAt = new Date();
    await session.save();
    const hydrated = await getOwnedSession(teacher.id, session.id);
    const formatted = formatSession(hydrated);
    await notifyStudent(hydrated, 'Class cancelled', `Your class "${hydrated.title}" has been cancelled.`);
    emitToUser(hydrated.studentProfile.userId, 'session:cancelled', formatted);
    return successResponse(res, 200, 'Teaching session cancelled successfully', formatted);
  } catch (error) {
    console.error('[Cancel Teaching Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to cancel teaching session');
  }
};

const startSession = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    const session = await getOwnedSession(teacher.id, req.params.sessionId);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    if (session.mode !== 'ONLINE' || session.status !== 'SCHEDULED' || (session.tutorRequestId && session.bookingStatus !== 'CONFIRMED')) return errorResponse(res, 409, 'Only confirmed, scheduled online sessions can be started');
    session.status = 'LIVE';
    session.startedAt = new Date();
    await session.save();
    const hydrated = await getOwnedSession(teacher.id, session.id);
    const formatted = formatSession(hydrated);
    await notifyStudent(hydrated, 'Online class is live', `Your online class "${hydrated.title}" is starting now.`);
    emitToUser(hydrated.studentProfile.userId, 'session:started', formatted);
    emitToClassroom(hydrated.id, 'classroom:started', formatted);
    return successResponse(res, 200, 'Online teaching session started successfully', formatted);
  } catch (error) {
    console.error('[Start Teaching Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to start teaching session');
  }
};

const completeSession = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    const session = await getOwnedSession(teacher.id, req.params.sessionId);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    if (session.status !== 'LIVE') return errorResponse(res, 409, 'Only live sessions can be completed');
    session.status = 'COMPLETED';
    session.completedAt = new Date();
    await session.save();
    const hydrated = await getOwnedSession(teacher.id, session.id);
    const formatted = formatSession(hydrated);
    await notifyStudent(hydrated, 'Online class ended', `Your online class "${hydrated.title}" has ended.`);
    emitToClassroom(hydrated.id, 'classroom:ended', formatted);
    emitToUser(hydrated.studentProfile.userId, 'session:completed', formatted);
    return successResponse(res, 200, 'Teaching session completed successfully', formatted);
  } catch (error) {
    console.error('[Complete Teaching Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to complete teaching session');
  }
};

const joinSession = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ where: { userId: req.user.id } });
    const session = student && await getStudentSession(student.id, req.params.sessionId);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    if (session.mode !== 'ONLINE' || session.status !== 'LIVE' || (session.tutorRequestId && session.bookingStatus !== 'CONFIRMED')) return errorResponse(res, 409, 'This confirmed online session is not live yet');
    return successResponse(res, 200, 'Online session join details retrieved', { sessionId: session.id, classRoomId: session.classRoomId, status: session.status, videoAvailable: true });
  } catch (error) {
    console.error('[Join Teaching Session Error]:', error.message);
    return errorResponse(res, 500, 'Failed to join teaching session');
  }
};

module.exports = { createSession, listTeacherSessions, listSubjects, listStudentSessions, getTeacherSession, getStudentSessionDetails, updateSession, cancelSession, startSession, joinSession, completeSession };