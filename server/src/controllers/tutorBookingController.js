const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  sequelize,
  TutorRequest,
  TutorProfile,
  TutorAvailability,
  TeachingSession,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
  ParentStudent,
  TutorBookingReport,
  User
} = require('../models');
const { createNotification } = require('../services/notificationService');
const { getTutorAssignmentDecision } = require('../utils/tutorAssignmentEligibility');

const includeSessionPeople = [
  { model: TeacherProfile, as: 'teacherProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
  { model: StudentProfile, as: 'studentProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
  { model: TutorRequest, as: 'bookingRequest', attributes: ['id', 'requesterUserId', 'requesterRole', 'subject', 'preferredMode', 'tutorProfileId', 'tutorUserId'] }
];

const formatTime = value => String(value || '').slice(0, 5);
const toMinutes = value => {
  const [hours, minutes] = formatTime(value).split(':').map(Number);
  return hours * 60 + minutes;
};
const fromMinutes = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value &&
    value >= new Date().toISOString().slice(0, 10);
};
const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const futureTime = (date, time) => date > new Date().toISOString().slice(0, 10) ||
  (date === new Date().toISOString().slice(0, 10) && new Date(`${date}T${time}:00`).getTime() > Date.now());

const getStudentForRequest = async (request, user, transaction) => {
  if (!request.studentProfileId) return null;
  const student = await StudentProfile.findByPk(request.studentProfileId, { transaction });
  if (!student) return null;
  if (user.role === 'student') return student.userId === user.id ? student : null;
  if (user.role !== 'parent') return null;
  const parent = await ParentProfile.findOne({ where: { userId: user.id }, transaction });
  if (!parent) return null;
  const link = await ParentStudent.findOne({
    where: { parentProfileId: parent.id, studentProfileId: student.id },
    transaction
  });
  return link ? student : null;
};

const getAcceptedRequest = async (requestId, user, transaction) => {
  const request = await TutorRequest.findOne({
    where: { id: requestId, requesterUserId: user.id, status: 'accepted' },
    transaction,
    lock: transaction?.LOCK?.UPDATE
  });
  if (!request) return { error: { status: 404, message: 'Accepted tutor request not found' } };
  const student = await getStudentForRequest(request, user, transaction);
  if (!student) return { error: { status: 403, message: 'You are not authorized for the student on this tutor request' } };
  const decision = getTutorAssignmentDecision(student, request.requesterRole);
  if (!decision.canRequest) {
    const messages = {
      age_unverified: 'Age eligibility must be verified before booking a tutor class',
      age_verification_pending: 'Age eligibility verification is pending administrator review',
      age_verification_rejected: 'Age eligibility verification was rejected. Request a new review before booking',
      dob_missing: 'Complete the student date of birth in their profile before booking a tutor class',
      dob_invalid: 'The student date of birth is invalid. Update the student profile before booking a tutor class',
      parent_required: 'A linked parent or guardian must manage tutor bookings for students aged 18 or younger',
      adult_student_must_request_independently: 'Adult students must manage tutor bookings from their own account'
    };
    return { error: { status: decision.reason === 'dob_missing' || decision.reason === 'dob_invalid' ? 400 : 403, message: messages[decision.reason] || 'This account is not authorized to manage this tutor booking' } };
  }
  return { request, student };
};

const getTutorProfile = async (request, transaction, lock = false) => {
  const options = { where: { id: request.tutorProfileId }, transaction };
  if (lock && transaction) options.lock = transaction.LOCK.UPDATE;
  return TutorProfile.findOne(options);
};

const getCandidateSlots = async ({ request, tutor, date, duration, mode, excludeSessionId, transaction }) => {
  const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(`${date}T00:00:00.000Z`).getUTCDay()];
  const teacher = await TeacherProfile.findOne({
    where: { userId: request.tutorUserId },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {})
  });
  if (!teacher) return [];
  const windows = await TutorAvailability.findAll({
    where: {
      tutorProfileId: tutor.id,
      dayOfWeek: weekday,
      isSlotActive: true,
      mode: { [Op.in]: [mode.toLowerCase(), 'both'] }
    },
    transaction
  });
  const currentSessions = await TeachingSession.findAll({
    where: {
      teacherProfileId: teacher.id,
      scheduledDate: date,
      status: { [Op.in]: ['SCHEDULED', 'LIVE'] },
      ...(excludeSessionId ? { id: { [Op.ne]: excludeSessionId } } : {})
    },
    attributes: ['startTime', 'endTime'],
    transaction
  });
  const blocked = currentSessions.map(session => [toMinutes(session.startTime), toMinutes(session.endTime)]);
  const slots = new Set();

  for (const window of windows) {
    const open = toMinutes(window.startTime);
    const close = toMinutes(window.endTime);
    for (let start = open; start + duration <= close; start += 30) {
      const end = start + duration;
      if (!blocked.some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart)) {
        slots.add(fromMinutes(start));
      }
    }
  }
  return [...slots].sort();
};

const validateBookingInput = body => {
  const duration = Number(body.durationMinutes);
  const mode = typeof body.mode === 'string' ? body.mode.toUpperCase() : '';
  if (!validDate(body.date) || !validTime(body.startTime) || !futureTime(body.date, body.startTime)) {
    return { error: 'Choose a valid future date and start time' };
  }
  if (!Number.isInteger(duration) || duration < 30 || duration > 240 || duration % 30 !== 0) {
    return { error: 'Duration must be between 30 and 240 minutes in 30-minute increments' };
  }
  if (!['ONLINE', 'OFFLINE'].includes(mode)) return { error: 'Mode must be ONLINE or OFFLINE' };
  if (typeof body.topic === 'string' && body.topic.length > 500) return { error: 'Topic must be 500 characters or fewer' };
  return { duration, mode, endTime: fromMinutes(toMinutes(body.startTime) + duration) };
};

const notifyBookingUsers = async (session, title, message, excludedUserId) => {
  const recipients = new Set([session.teacherProfile?.userId, session.studentProfile?.userId, session.bookingRequest?.requesterUserId]);
  recipients.delete(excludedUserId);
  for (const recipientUserId of recipients) {
    if (recipientUserId) {
      await createNotification({
        recipientUserId,
        type: 'GENERAL',
        title,
        message,
        relatedEntityType: 'teaching_session',
        relatedEntityId: session.id
      });
    }
  }
};

const formatBooking = (session, authorized) => ({
  id: session.id,
  tutorRequestId: session.tutorRequestId,
  studentProfileId: session.studentProfileId,
  teacherName: session.teacherProfile?.user?.name || 'Tutor',
  studentName: session.studentProfile?.user?.name || 'Student',
  subject: session.subjectName || session.title,
  title: session.title,
  topic: session.description || '',
  date: session.scheduledDate,
  startTime: formatTime(session.startTime),
  endTime: formatTime(session.endTime),
  durationMinutes: toMinutes(session.endTime) - toMinutes(session.startTime),
  mode: session.mode,
  status: session.status,
  bookingStatus: session.bookingStatus,
  location: authorized && session.mode === 'OFFLINE' ? session.location || '' : '',
  classRoomId: session.classRoomId,
  cancellationReason: session.cancellationReason || '',
  createdAt: session.createdAt,
  updatedAt: session.updatedAt
});

const getAuthorizedBooking = async (sessionId, user, transaction) => {
  const options = { include: includeSessionPeople };
  if (transaction) {
    options.transaction = transaction;
    options.lock = transaction.LOCK.UPDATE;
  }
  const session = await TeachingSession.findByPk(sessionId, options);
  if (!session || !session.bookingRequest) return null;
  if (user.role === 'teacher' && session.teacherProfile?.userId === user.id) return session;
  if (user.role === 'student' && session.studentProfile?.userId === user.id) return session;
  if (user.role === 'parent' && session.studentProfileId) {
    const parent = await ParentProfile.findOne({ where: { userId: user.id }, transaction });
    const linked = parent && await ParentStudent.findOne({
      where: { parentProfileId: parent.id, studentProfileId: session.studentProfileId },
      transaction
    });
    const decision = getTutorAssignmentDecision(session.studentProfile, 'parent');
    if (linked && session.bookingRequest.requesterUserId === user.id && decision.canRequest) return session;
  }
  return null;
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const duration = Number(req.query.durationMinutes || 60);
    const mode = String(req.query.mode || '').toUpperCase();
    const date = req.query.date;
    if (!validDate(date) || !Number.isInteger(duration) || duration < 30 || duration > 240 || duration % 30 !== 0 ||
        !['ONLINE', 'OFFLINE'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Provide a valid future date, 30-minute duration, and class mode' });
    }
    const access = await getAcceptedRequest(req.params.requestId, req.user);
    if (access.error) return res.status(access.error.status).json({ success: false, message: access.error.message });
    const tutor = await getTutorProfile(access.request);
    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    if (access.request.preferredMode !== 'both' && access.request.preferredMode.toUpperCase() !== mode) {
      return res.status(400).json({ success: false, message: 'This class mode is outside the tutor request preference' });
    }
    const slots = await getCandidateSlots({ request: access.request, tutor, date, duration, mode });
    return res.status(200).json({ success: true, data: { slots, date, durationMinutes: duration, mode } });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    if (!['student', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only students or parents can request a class booking' });
    }
    const input = validateBookingInput(req.body || {});
    if (input.error) return res.status(400).json({ success: false, message: input.error });
    const created = await sequelize.transaction(async transaction => {
      const access = await getAcceptedRequest(req.body.tutorRequestId, req.user, transaction);
      if (access.error) {
        const error = new Error(access.error.message);
        error.status = access.error.status;
        throw error;
      }
      if (access.request.teachingSessionId) {
        const error = new Error('A booking has already been created for this tutor request');
        error.status = 409;
        throw error;
      }
      const tutor = await getTutorProfile(access.request, transaction, true);
      if (tutor?.teachingMode !== 'both' && tutor?.teachingMode !== input.mode.toLowerCase()) {
        const error = new Error('The tutor does not offer this class mode');
        error.status = 400;
        throw error;
      }
      const teacher = await TeacherProfile.findOne({ where: { userId: access.request.tutorUserId }, transaction });
      if (!tutor || !teacher) {
        const error = new Error('Tutor teaching profile is unavailable');
        error.status = 404;
        throw error;
      }
      if (access.request.preferredMode !== 'both' && access.request.preferredMode.toUpperCase() !== input.mode) {
        const error = new Error('This class mode is outside the tutor request preference');
        error.status = 400;
        throw error;
      }
      const slots = await getCandidateSlots({
        request: access.request,
        tutor,
        date: req.body.date,
        duration: input.duration,
        mode: input.mode,
        transaction
      });
      if (!slots.includes(req.body.startTime)) {
        const error = new Error('This time is not currently available. Select another available slot.');
        error.status = 409;
        throw error;
      }
      const student = access.student;
      const title = `${access.request.subject} Tutoring Class - ${access.request.studentName || 'Student'}`.slice(0, 150);
      const session = await TeachingSession.create({
        teacherProfileId: teacher.id,
        studentProfileId: student.id,
        tutorRequestId: access.request.id,
        subjectName: access.request.subject,
        title,
        description: typeof req.body.topic === 'string' ? req.body.topic.trim() : '',
        mode: input.mode,
        scheduledDate: req.body.date,
        startTime: req.body.startTime,
        endTime: input.endTime,
        bookingStatus: 'REQUESTED',
        location: input.mode === 'OFFLINE' ? [tutor.area, tutor.city].filter(Boolean).join(', ') : '',
        classRoomId: `class-${crypto.randomUUID()}`
      }, { transaction });
      await access.request.update({ teachingSessionId: session.id }, { transaction });
      return session;
    });
    const session = await TeachingSession.findByPk(created.id, { include: includeSessionPeople });
    await notifyBookingUsers(session, 'New class booking request', `${session.studentProfile?.user?.name || 'A learner'} requested ${session.subjectName} on ${session.scheduledDate} at ${formatTime(session.startTime)}.`, req.user.id);
    return res.status(201).json({ success: true, message: 'Booking request sent to the tutor', data: formatBooking(session, true) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

const listBookings = async (req, res, next) => {
  try {
    let where = { tutorRequestId: { [Op.ne]: null } };
    if (req.user.role === 'teacher') {
      const teacher = await TeacherProfile.findOne({ where: { userId: req.user.id } });
      where.teacherProfileId = teacher?.id || -1;
    } else if (req.user.role === 'student') {
      const student = await StudentProfile.findOne({ where: { userId: req.user.id } });
      where.studentProfileId = student?.id || -1;
    } else {
      const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
      const links = parent ? await ParentStudent.findAll({ where: { parentProfileId: parent.id }, attributes: ['studentProfileId'] }) : [];
      where.studentProfileId = { [Op.in]: links.length ? links.map(link => link.studentProfileId) : [-1] };
      where['$bookingRequest.requesterUserId$'] = req.user.id;
    }
    if (req.query.status && ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(String(req.query.status).toUpperCase())) {
      where.status = String(req.query.status).toUpperCase();
    }
    const sessions = await TeachingSession.findAll({
      where,
      include: includeSessionPeople,
      order: [['scheduledDate', 'ASC'], ['startTime', 'ASC']]
    });
    return res.status(200).json({ success: true, data: sessions.map(session => formatBooking(session, true)) });
  } catch (error) {
    next(error);
  }
};

const listAdminBookings = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const where = { tutorRequestId: { [Op.ne]: null } };
    if (['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(String(req.query.status || '').toUpperCase())) {
      where.status = String(req.query.status).toUpperCase();
    }
    if (['REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'].includes(String(req.query.bookingStatus || '').toUpperCase())) {
      where.bookingStatus = String(req.query.bookingStatus).toUpperCase();
    }
    const { count, rows } = await TeachingSession.findAndCountAll({
      where,
      include: includeSessionPeople,
      limit,
      offset: (page - 1) * limit,
      order: [['scheduledDate', 'DESC'], ['startTime', 'DESC']]
    });
    return res.status(200).json({
      success: true,
      data: { bookings: rows.map(session => formatBooking(session, true)), page, limit, total: count }
    });
  } catch (error) {
    next(error);
  }
};

const createBookingReport = async (req, res, next) => {
  try {
    const session = await getAuthorizedBooking(req.params.bookingId, req.user);
    if (!session) return res.status(404).json({ success: false, message: 'Booking not found' });
    const allowedCategories = req.user.role === 'teacher'
      ? ['STUDENT_ISSUE', 'BOOKING_ISSUE', 'TECHNICAL_ISSUE', 'OTHER']
      : ['TUTOR_ISSUE', 'BOOKING_ISSUE', 'TECHNICAL_ISSUE', 'OTHER'];
    const category = typeof req.body.category === 'string' ? req.body.category.toUpperCase() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!allowedCategories.includes(category) || !description || description.length > 2000) {
      return res.status(400).json({ success: false, message: 'Choose a valid report category and provide a description of up to 2000 characters' });
    }
    const report = await TutorBookingReport.create({
      teachingSessionId: session.id,
      reporterUserId: req.user.id,
      category,
      description
    });
    const admins = await User.findAll({ where: { role: 'admin', isActive: true }, attributes: ['id'] });
    for (const admin of admins) {
      await createNotification({
        recipientUserId: admin.id,
        type: 'GENERAL',
        title: 'Marketplace booking issue reported',
        message: `A ${category.toLowerCase().replaceAll('_', ' ')} was reported for booking ${session.id}.`,
        relatedEntityType: 'tutor_booking_report',
        relatedEntityId: report.id
      });
    }
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const listAdminBookingReports = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const where = {};
    if (['OPEN', 'REVIEWED', 'CLOSED'].includes(String(req.query.status || '').toUpperCase())) {
      where.status = String(req.query.status).toUpperCase();
    }
    const { count, rows } = await TutorBookingReport.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'role'] },
        { model: TeachingSession, as: 'teachingSession', include: includeSessionPeople }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({
      success: true,
      data: {
        reports: rows.map(report => ({
          id: report.id,
          category: report.category,
          description: report.description,
          status: report.status,
          adminNote: report.adminNote,
          reporter: report.reporter ? { id: report.reporter.id, name: report.reporter.name, role: report.reporter.role } : null,
          booking: report.teachingSession ? formatBooking(report.teachingSession, true) : null,
          createdAt: report.createdAt
        })),
        page,
        limit,
        total: count
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminBookingReport = async (req, res, next) => {
  try {
    const report = await TutorBookingReport.findByPk(req.params.reportId);
    if (!report) return res.status(404).json({ success: false, message: 'Booking report not found' });
    const status = typeof req.body.status === 'string' ? req.body.status.toUpperCase() : '';
    const adminNote = typeof req.body.adminNote === 'string' ? req.body.adminNote.trim() : '';
    if (!['OPEN', 'REVIEWED', 'CLOSED'].includes(status) || adminNote.length > 1000) {
      return res.status(400).json({ success: false, message: 'Provide a valid report status and a note up to 1000 characters' });
    }
    await report.update({ status, adminNote: adminNote || null });
    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const session = await getAuthorizedBooking(req.params.bookingId, req.user);
    if (!session) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: formatBooking(session, true) });
  } catch (error) {
    next(error);
  }
};

const updateBookingDecision = async (req, res, next) => {
  try {
    const decision = req.params.decision === 'confirm' ? 'CONFIRMED' : 'REJECTED';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (decision === 'REJECTED' && reason.length > 500) {
      return res.status(400).json({ success: false, message: 'Rejection reason must be 500 characters or fewer' });
    }
    const sessionId = await sequelize.transaction(async transaction => {
      const session = await getAuthorizedBooking(req.params.bookingId, req.user, transaction);
      if (!session || req.user.role !== 'teacher' || session.teacherProfile?.userId !== req.user.id) {
        const error = new Error('Booking not found');
        error.status = 404;
        throw error;
      }
      if (session.bookingStatus !== 'REQUESTED' || session.status !== 'SCHEDULED') {
        const error = new Error('Only pending booking requests can be confirmed or rejected');
        error.status = 409;
        throw error;
      }
      session.bookingStatus = decision;
      if (decision === 'REJECTED') {
        session.status = 'CANCELLED';
        session.cancelledAt = new Date();
        session.cancellationReason = reason || 'Tutor declined booking';
      }
      await session.save({ transaction });
      return session.id;
    });
    const refreshed = await TeachingSession.findByPk(sessionId, { include: includeSessionPeople });
    const message = decision === 'CONFIRMED'
      ? `Your ${refreshed.subjectName} class on ${refreshed.scheduledDate} at ${formatTime(refreshed.startTime)} is confirmed.`
      : `Your booking request for ${refreshed.subjectName} was declined.`;
    await notifyBookingUsers(refreshed, decision === 'CONFIRMED' ? 'Class booking confirmed' : 'Class booking declined', message, req.user.id);
    return res.status(200).json({ success: true, data: formatBooking(refreshed, true) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

const rescheduleBooking = async (req, res, next) => {
  try {
    if (!['student', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only the student or linked parent can request a reschedule' });
    }
    const input = validateBookingInput(req.body || {});
    if (input.error) return res.status(400).json({ success: false, message: input.error });
    const updated = await sequelize.transaction(async transaction => {
      const session = await TeachingSession.findByPk(req.params.bookingId, { include: includeSessionPeople, transaction, lock: transaction.LOCK.UPDATE });
      if (!session || !session.bookingRequest) {
        const error = new Error('Booking not found');
        error.status = 404;
        throw error;
      }
      const parent = req.user.role === 'parent'
        ? await ParentProfile.findOne({ where: { userId: req.user.id }, transaction })
        : null;
      const parentLink = parent && await ParentStudent.findOne({
        where: { parentProfileId: parent.id, studentProfileId: session.studentProfileId },
        transaction
      });
      const authorized = req.user.role === 'student'
        ? session.studentProfile?.userId === req.user.id
        : Boolean(parentLink && session.bookingRequest.requesterUserId === req.user.id);
      if (!authorized || !['REQUESTED', 'CONFIRMED'].includes(session.bookingStatus) || session.status !== 'SCHEDULED') {
        const error = new Error('This booking cannot be rescheduled');
        error.status = authorized ? 409 : 404;
        throw error;
      }
      const assignmentDecision = ['student', 'parent'].includes(req.user.role)
        ? getTutorAssignmentDecision(session.studentProfile, req.user.role)
        : { canRequest: true, reason: 'eligible' };
      if (!assignmentDecision.canRequest) {
        const messages = {
          age_unverified: 'Age eligibility must be verified before managing this tutor booking',
          age_verification_pending: 'Age eligibility verification is pending administrator review',
          age_verification_rejected: 'Age eligibility verification was rejected. Request a new review before managing this tutor booking',
          dob_missing: 'Complete the student date of birth in their profile before managing this tutor booking',
          dob_invalid: 'The student date of birth is invalid. Update the student profile before managing this tutor booking',
          parent_required: 'A linked parent or guardian must manage tutor bookings for students aged 18 or younger',
          adult_student_must_request_independently: 'Adult students must manage tutor bookings from their own account'
        };
        const error = new Error(messages[assignmentDecision.reason] || 'This account is not authorized to manage this tutor booking');
        error.status = assignmentDecision.reason === 'dob_missing' || assignmentDecision.reason === 'dob_invalid' ? 400 : 403;
        throw error;
      }
      const tutor = await getTutorProfile(session.bookingRequest, transaction, true);
      if (session.bookingRequest.preferredMode !== 'both' && session.bookingRequest.preferredMode.toUpperCase() !== input.mode) {
        const error = new Error('This class mode is outside the tutor request preference');
        error.status = 400;
        throw error;
      }
      if (tutor?.teachingMode !== 'both' && tutor?.teachingMode !== input.mode.toLowerCase()) {
        const error = new Error('The tutor does not offer this class mode');
        error.status = 400;
        throw error;
      }
      const slots = await getCandidateSlots({
        request: session.bookingRequest,
        tutor,
        date: req.body.date,
        duration: input.duration,
        mode: input.mode,
        excludeSessionId: session.id,
        transaction
      });
      if (!slots.includes(req.body.startTime)) {
        const error = new Error('This time is not currently available. Select another available slot.');
        error.status = 409;
        throw error;
      }
      session.scheduledDate = req.body.date;
      session.startTime = req.body.startTime;
      session.endTime = input.endTime;
      session.mode = input.mode;
      session.description = typeof req.body.topic === 'string' ? req.body.topic.trim() : session.description;
      session.location = input.mode === 'OFFLINE' ? [tutor.area, tutor.city].filter(Boolean).join(', ') : '';
      session.bookingStatus = 'REQUESTED';
      await session.save({ transaction });
      return session.id;
    });
    const session = await TeachingSession.findByPk(updated, { include: includeSessionPeople });
    await notifyBookingUsers(session, 'Class reschedule requested', `The schedule for ${session.subjectName} changed to ${session.scheduledDate} at ${formatTime(session.startTime)}. Tutor confirmation is required.`, req.user.id);
    return res.status(200).json({ success: true, data: formatBooking(session, true) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length > 500) return res.status(400).json({ success: false, message: 'Cancellation reason must be 500 characters or fewer' });
    const sessionId = await sequelize.transaction(async transaction => {
      const session = await getAuthorizedBooking(req.params.bookingId, req.user, transaction);
      if (!session) {
        const error = new Error('Booking not found');
        error.status = 404;
        throw error;
      }
      if (!['REQUESTED', 'CONFIRMED'].includes(session.bookingStatus) || session.status !== 'SCHEDULED') {
        const error = new Error('Only upcoming bookings can be cancelled');
        error.status = 409;
        throw error;
      }
      const assignmentDecision = ['student', 'parent'].includes(req.user.role)
        ? getTutorAssignmentDecision(session.studentProfile, req.user.role)
        : { canRequest: true, reason: 'eligible' };
      if (!assignmentDecision.canRequest) {
        const messages = {
          age_unverified: 'Age eligibility must be verified before managing this tutor booking',
          age_verification_pending: 'Age eligibility verification is pending administrator review',
          age_verification_rejected: 'Age eligibility verification was rejected. Request a new review before managing this tutor booking',
          dob_missing: 'Complete the student date of birth in their profile before managing this tutor booking',
          dob_invalid: 'The student date of birth is invalid. Update the student profile before managing this tutor booking',
          parent_required: 'A linked parent or guardian must manage tutor bookings for students aged 18 or younger',
          adult_student_must_request_independently: 'Adult students must manage tutor bookings from their own account'
        };
        const error = new Error(messages[assignmentDecision.reason] || 'This account is not authorized to manage this tutor booking');
        error.status = assignmentDecision.reason === 'dob_missing' || assignmentDecision.reason === 'dob_invalid' ? 400 : 403;
        throw error;
      }
      session.status = 'CANCELLED';
      session.bookingStatus = 'CANCELLED';
      session.cancelledAt = new Date();
      session.cancellationReason = reason || 'No reason provided';
      await session.save({ transaction });
      return session.id;
    });
    const refreshed = await TeachingSession.findByPk(sessionId, { include: includeSessionPeople });
    await notifyBookingUsers(refreshed, 'Class booking cancelled', `The ${refreshed.subjectName} class on ${refreshed.scheduledDate} was cancelled.`, req.user.id);
    return res.status(200).json({ success: true, data: formatBooking(refreshed, true) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  createBooking,
  listBookings,
  listAdminBookings,
  createBookingReport,
  listAdminBookingReports,
  updateAdminBookingReport,
  getBooking,
  updateBookingDecision,
  rescheduleBooking,
  cancelBooking
};
