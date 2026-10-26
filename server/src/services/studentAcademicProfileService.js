const { Op } = require('sequelize');
const { StudentProfile, Marks, Attendance, Homework, HomeworkSubmission, TeachingSession, ClassFeedback } = require('../models');

const getAcademicProfile = async (studentProfileId) => {
  const student = await StudentProfile.findByPk(studentProfileId);
  if (!student) return null;

  const [marks, attendance, homeworks, sessions] = await Promise.all([
    Marks.findAll({ where: { studentId: student.id }, attributes: ['subject', 'examName', 'examType', 'obtainedMarks', 'maxMarks', 'examDate'], order: [['examDate', 'ASC'], ['id', 'ASC']] }),
    Attendance.findAll({ where: { studentProfileId: student.id }, attributes: ['subject', 'status', 'date'] }),
    Homework.findAll({ where: { className: student.className || '', section: student.section || '', status: { [Op.ne]: 'draft' } }, include: [{ model: HomeworkSubmission, as: 'submissions', required: false, where: { studentId: student.id }, attributes: ['status', 'marksObtained', 'submittedAt', 'teacherFeedback'] }], order: [['dueDate', 'DESC']] }),
    TeachingSession.findAll({ where: { studentProfileId: student.id }, include: [{ model: ClassFeedback, as: 'feedback', required: false, attributes: ['understandingLevel', 'feedback', 'improvementTopics'] }], order: [['scheduledDate', 'DESC'], ['id', 'DESC']], limit: 20 })
  ]);

  const subjectMap = new Map();
  marks.forEach((mark) => {
    const current = subjectMap.get(mark.subject) || { subject: mark.subject, assessments: 0, obtained: 0, max: 0, scores: [] };
    current.assessments += 1;
    current.obtained += Number(mark.obtainedMarks);
    current.max += Number(mark.maxMarks);
    current.scores.push({ examName: mark.examName, percentage: Math.round((Number(mark.obtainedMarks) / Number(mark.maxMarks)) * 100), examDate: mark.examDate });
    subjectMap.set(mark.subject, current);
  });
  const subjects = Array.from(subjectMap.values()).map((item) => ({ ...item, percentage: item.max ? Math.round((item.obtained / item.max) * 100) : 0 }));
  const present = attendance.filter((item) => item.status === 'present').length;
  const attendancePercentage = attendance.length ? Math.round((present / attendance.length) * 100) : null;
  const submitted = homeworks.filter((item) => item.submissions?.[0]).length;
  const pending = homeworks.filter((item) => !item.submissions?.[0]).length;
  const feedback = sessions.filter((item) => item.feedback).map((item) => item.feedback);

  return {
    studentProfileId: student.id,
    className: student.className || '',
    subjects,
    marksCount: marks.length,
    attendance: { total: attendance.length, present, percentage: attendancePercentage },
    assignments: { total: homeworks.length, submitted, pending, submissionRate: homeworks.length ? Math.round((submitted / homeworks.length) * 100) : null },
    feedback,
    recentPerformance: subjects.flatMap((item) => item.scores.map((score) => ({ subject: item.subject, ...score }))).slice(-10)
  };
};

const teacherCanAccessStudent = async (teacherProfile, studentProfileId) => {
  const student = await StudentProfile.findByPk(studentProfileId);
  if (!student || !teacherProfile) return false;
  if (teacherProfile.className?.trim() && teacherProfile.className.trim() !== student.className) return false;
  if (teacherProfile.section?.trim() && teacherProfile.section.trim() !== student.section) return false;
  return true;
};

module.exports = { getAcademicProfile, teacherCanAccessStudent };
