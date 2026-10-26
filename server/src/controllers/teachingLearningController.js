const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const {
  User, TeacherProfile, StudentProfile, ParentProfile, ParentStudent,
  TeachingSession, TeachingSessionParticipant, ClassResource, ClassNote, ClassFeedback,
  Subject, Homework, HomeworkSubmission, Marks
} = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { cleanupResource } = require('../middleware/classResourceUpload');

const sessionInclude = [
  { model: TeacherProfile, as: 'teacherProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
  { model: StudentProfile, as: 'studentProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
  { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
  { model: TeachingSessionParticipant, as: 'participants', attributes: ['id', 'userId', 'role', 'joinedAt', 'leftAt'] },
  { model: ClassNote, as: 'note', attributes: ['id', 'content', 'authorUserId', 'createdAt', 'updatedAt'] },
  { model: ClassFeedback, as: 'feedback', attributes: ['id', 'understandingLevel', 'feedback', 'improvementTopics', 'homeworkRecommendation', 'authorUserId', 'createdAt', 'updatedAt'] }
];

const getTeacher = (userId) => TeacherProfile.findOne({ where: { userId } });
const getStudent = (userId) => StudentProfile.findOne({ where: { userId } });
const getSession = (id) => TeachingSession.findByPk(id, { include: sessionInclude });
const teacherOwns = (session, teacher) => Boolean(session && teacher && session.teacherProfileId === teacher.id);
const studentOwns = (session, student) => Boolean(session && student && session.studentProfileId === student.id);

const minutesBetween = (start, end) => start && end ? Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000)) : 0;
const scheduledMinutes = (session) => minutesBetween(`${session.scheduledDate}T${session.startTime}`, `${session.scheduledDate}T${session.endTime}`);
const participantDuration = (participant) => minutesBetween(participant?.joinedAt, participant?.leftAt || participant?.teachingSession?.completedAt || new Date());
const attendanceStatus = (attended, scheduled) => {
  if (!attended) return 'ABSENT';
  if (!scheduled || attended >= Math.ceil(scheduled * 0.8)) return 'PRESENT';
  return 'PARTIAL';
};

const formatSummary = (session) => {
  const studentParticipant = session.participants?.find((item) => item.userId === session.studentProfile?.userId && item.role === 'student');
  const teacherParticipant = session.participants?.find((item) => item.userId === session.teacherProfile?.userId && item.role === 'teacher');
  const actualDuration = minutesBetween(session.startedAt, session.completedAt);
  const studentDuration = participantDuration({ ...studentParticipant, teachingSession: session });
  return {
    sessionId: session.id,
    scheduledDate: session.scheduledDate,
    subject: session.subject?.name || session.subjectName || '',
    topic: session.title,
    description: session.description || '',
    teacher: session.teacherProfile?.user?.name || '',
    student: session.studentProfile?.user?.name || '',
    scheduledDuration: scheduledMinutes(session),
    actualDuration,
    teacherJoinedAt: teacherParticipant?.joinedAt || null,
    teacherLeftAt: teacherParticipant?.leftAt || session.completedAt || null,
    studentJoinedAt: studentParticipant?.joinedAt || null,
    studentLeftAt: studentParticipant?.leftAt || session.completedAt || null,
    studentAttendanceMinutes: studentDuration,
    studentAttendanceStatus: attendanceStatus(studentDuration, scheduledMinutes(session)),
    status: session.status,
    feedback: session.feedback || null,
    note: session.note || null
  };
};

const authorizedSessionForUser = async (req, res) => {
  const session = await getSession(req.params.sessionId);
  if (!session) return { session: null, role: null };
  const teacher = req.user.role === 'teacher' ? await getTeacher(req.user.id) : null;
  const student = req.user.role === 'student' ? await getStudent(req.user.id) : null;
  if (teacherOwns(session, teacher)) return { session, role: 'teacher' };
  if (studentOwns(session, student)) return { session, role: 'student' };
  return { session: null, role: null };
};

const serializeResource = (resource, req) => ({
  id: resource.id,
  filename: resource.originalFilename,
  fileType: resource.mimeType,
  fileSize: resource.fileSize,
  uploadDate: resource.uploadedAt,
  uploadedBy: resource.uploader?.name || 'Teacher',
  downloadUrl: `${req.protocol}://${req.get('host')}/api/teaching-resources/${resource.id}`
});

const listResources = async (req, res) => {
  try {
    const { session } = await authorizedSessionForUser(req, res);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    const resources = await ClassResource.findAll({ where: { teachingSessionId: session.id }, include: [{ model: User, as: 'uploader', attributes: ['name'] }], order: [['uploadedAt', 'DESC']] });
    return successResponse(res, 200, 'Class resources retrieved successfully', { resources: resources.map((item) => serializeResource(item, req)), count: resources.length });
  } catch (error) {
    console.error('[List Class Resources Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve class resources');
  }
};

const uploadResource = async (req, res) => {
  try {
    const teacher = await getTeacher(req.user.id);
    const session = await getSession(req.params.sessionId);
    if (!teacherOwns(session, teacher)) { cleanupResource(req.file ? [req.file] : []); return errorResponse(res, 404, 'Teaching session not found'); }
    const resource = await ClassResource.create({ teachingSessionId: session.id, uploadedByUserId: req.user.id, originalFilename: path.basename(req.file.originalname), storedFilename: req.file.filename, mimeType: req.file.mimetype, fileSize: req.file.size, storagePath: req.file.path });
    const hydrated = await ClassResource.findByPk(resource.id, { include: [{ model: User, as: 'uploader', attributes: ['name'] }] });
    return successResponse(res, 201, 'Class resource uploaded successfully', serializeResource(hydrated, req));
  } catch (error) {
    cleanupResource(req.file ? [req.file] : []);
    console.error('[Upload Class Resource Error]:', error.message);
    return errorResponse(res, 500, 'Failed to upload class resource');
  }
};

const downloadResource = async (req, res) => {
  try {
    const resource = await ClassResource.findByPk(req.params.resourceId);
    if (!resource) return errorResponse(res, 404, 'Resource not found');
    const session = await getSession(resource.teachingSessionId);
    const teacher = req.user.role === 'teacher' ? await getTeacher(req.user.id) : null;
    const student = req.user.role === 'student' ? await getStudent(req.user.id) : null;
    let allowed = teacherOwns(session, teacher) || studentOwns(session, student);
    if (req.user.role === 'parent') {
      const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
      allowed = Boolean(parent && await ParentStudent.findOne({ where: { parentProfileId: parent.id, studentProfileId: session.studentProfileId } }));
    }
    if (!allowed) return errorResponse(res, 403, 'You are not authorized to access this resource');
    if (!fs.existsSync(resource.storagePath)) return errorResponse(res, 404, 'Resource file is unavailable');
    res.setHeader('Content-Type', resource.mimeType);
    res.setHeader('Content-Disposition', `${req.query.download === '1' ? 'attachment' : 'inline'}; filename="${path.basename(resource.originalFilename).replace(/"/g, '')}"`);
    return res.sendFile(path.resolve(resource.storagePath));
  } catch (error) {
    console.error('[Download Class Resource Error]:', error.message);
    return errorResponse(res, 500, 'Failed to access class resource');
  }
};

const saveNote = async (req, res) => {
  try {
    const teacher = await getTeacher(req.user.id);
    const session = await getSession(req.params.sessionId);
    if (!teacherOwns(session, teacher)) return errorResponse(res, 404, 'Teaching session not found');
    if (!req.body.content || typeof req.body.content !== 'string' || !req.body.content.trim()) return errorResponse(res, 400, 'Note content is required');
    const [note] = await ClassNote.findOrCreate({ where: { teachingSessionId: session.id }, defaults: { teachingSessionId: session.id, authorUserId: req.user.id, content: req.body.content.trim() } });
    if (note.authorUserId !== req.user.id) return errorResponse(res, 403, 'Only the note author can update this note');
    note.content = req.body.content.trim();
    await note.save();
    return successResponse(res, 200, 'Class notes saved successfully', note);
  } catch (error) {
    console.error('[Save Class Note Error]:', error.message);
    return errorResponse(res, 500, 'Failed to save class notes');
  }
};

const saveFeedback = async (req, res) => {
  try {
    const teacher = await getTeacher(req.user.id);
    const session = await getSession(req.params.sessionId);
    if (!teacherOwns(session, teacher)) return errorResponse(res, 404, 'Teaching session not found');
    const { understandingLevel, feedback, improvementTopics = '', homeworkRecommendation = '' } = req.body || {};
    if (!understandingLevel || !feedback || typeof feedback !== 'string') return errorResponse(res, 400, 'Understanding level and feedback are required');
    const [record] = await ClassFeedback.findOrCreate({ where: { teachingSessionId: session.id }, defaults: { teachingSessionId: session.id, authorUserId: req.user.id, understandingLevel, feedback: feedback.trim(), improvementTopics, homeworkRecommendation } });
    if (record.authorUserId !== req.user.id) return errorResponse(res, 403, 'Only the feedback author can update this feedback');
    Object.assign(record, { understandingLevel, feedback: feedback.trim(), improvementTopics, homeworkRecommendation });
    await record.save();
    return successResponse(res, 200, 'Class feedback saved successfully', record);
  } catch (error) {
    console.error('[Save Class Feedback Error]:', error.message);
    return errorResponse(res, 500, 'Failed to save class feedback');
  }
};

const getSummary = async (req, res) => {
  try {
    const { session } = await authorizedSessionForUser(req, res);
    if (!session) return errorResponse(res, 404, 'Teaching session not found');
    return successResponse(res, 200, 'Class summary retrieved successfully', formatSummary(session));
  } catch (error) {
    console.error('[Get Class Summary Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve class summary');
  }
};

const getStudentHistory = async (req, res) => {
  try {
    const student = await getStudent(req.user.id);
    if (!student) return errorResponse(res, 404, 'Student profile not found');
    const sessions = await TeachingSession.findAll({ where: { studentProfileId: student.id }, include: sessionInclude, order: [['scheduledDate', 'DESC'], ['startTime', 'DESC']] });
    const homeworks = await Homework.findAll({ where: { className: student.className, status: { [Op.ne]: 'draft' } }, include: [{ model: HomeworkSubmission, as: 'submissions', required: false, where: { studentId: student.id } }], order: [['dueDate', 'DESC']] });
    const marks = await Marks.findAll({ where: { studentId: student.id }, order: [['examDate', 'DESC'], ['id', 'DESC']] });
    return successResponse(res, 200, 'Learning history retrieved successfully', { sessions: sessions.map((item) => ({ ...formatSummary(item), subject: item.subject?.name || item.subjectName || '' })), assignments: homeworks, grades: marks });
  } catch (error) {
    console.error('[Get Student Learning History Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve learning history');
  }
};

const getParentSessions = async (req, res) => {
  try {
    const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
    const student = await StudentProfile.findOne({ where: { [Op.or]: [{ id: Number(req.params.studentId) || 0 }, { studentId: String(req.params.studentId) }] } });
    if (!parent || !student || !await ParentStudent.findOne({ where: { parentProfileId: parent.id, studentProfileId: student.id } })) return errorResponse(res, 403, 'Access denied for this student');
    const sessions = await TeachingSession.findAll({ where: { studentProfileId: student.id }, include: sessionInclude, order: [['scheduledDate', 'DESC'], ['startTime', 'DESC']] });
    return successResponse(res, 200, 'Child class history retrieved successfully', { sessions: sessions.map(formatSummary), count: sessions.length });
  } catch (error) {
    console.error('[Get Parent Sessions Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve child class history');
  }
};

module.exports = { listResources, uploadResource, downloadResource, saveNote, saveFeedback, getSummary, getStudentHistory, getParentSessions };
