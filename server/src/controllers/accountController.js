const {
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  Attendance,
  HomeworkSubmission,
  Marks,
  Message,
  Notification,
  AIChatHistory,
  TutorProfile,
  TutorRequest,
  TutorReview,
  TutorShortlist,
  Course,
  CourseEnrollment
} = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { clearAuthCookies } = require('../utils/authCookie');

const safeJson = (value) => (value && typeof value.toJSON === 'function' ? value.toJSON() : value);

/**
 * Export all personal data held for the authenticated account.
 * @route GET /api/account/export
 */
const exportAccountData = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: StudentProfile, as: 'studentProfile', required: false },
        { model: TeacherProfile, as: 'teacherProfile', required: false },
        { model: ParentProfile, as: 'parentProfile', required: false },
        { model: TutorProfile, as: 'tutorProfile', required: false }
      ]
    });

    if (!user) return errorResponse(res, 404, 'Account not found');

    const userId = user.id;
    const studentProfileId = user.studentProfile?.id;
    const teacherProfileId = user.teacherProfile?.id;
    const parentProfileId = user.parentProfile?.id;
    const parentLinkConditions = [
      ...(studentProfileId ? [{ studentProfileId }] : []),
      ...(parentProfileId ? [{ parentProfileId }] : [])
    ];

    const [
      parentLinks,
      attendance,
      submissions,
      marks,
      messages,
      notifications,
      aiHistory,
      sentTutorRequests,
      receivedTutorRequests,
      reviews,
      shortlists,
      courses,
      enrollments
    ] = await Promise.all([
      parentLinkConditions.length
        ? ParentStudent.findAll({ where: { [Op.or]: parentLinkConditions } })
        : [],
      studentProfileId ? Attendance.findAll({ where: { studentProfileId } }) : [],
      studentProfileId ? HomeworkSubmission.findAll({ where: { studentId: studentProfileId } }) : [],
      studentProfileId ? Marks.findAll({ where: { studentId: studentProfileId } }) : [],
      Message.findAll({ where: { senderUserId: userId }, order: [['createdAt', 'ASC']] }),
      Notification.findAll({ where: { recipientUserId: userId }, order: [['createdAt', 'ASC']] }),
      AIChatHistory.findAll({ where: { userId }, order: [['createdAt', 'ASC']] }),
      TutorRequest.findAll({ where: { requesterUserId: userId } }),
      TutorRequest.findAll({ where: { tutorUserId: userId } }),
      TutorReview.findAll({ where: { reviewerUserId: userId } }),
      TutorShortlist.findAll({ where: { userId } }),
      teacherProfileId ? Course.findAll({ where: { teacherProfileId } }) : [],
      studentProfileId ? CourseEnrollment.findAll({ where: { studentProfileId } }) : []
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      notice: 'This export contains personal data held by EduSetu. It excludes passwords and internal security logs.',
      account: safeJson(user),
      linkedGuardianOrStudentRecords: parentLinks.map(safeJson),
      attendance: attendance.map(safeJson),
      homeworkSubmissions: submissions.map(safeJson),
      marks: marks.map(safeJson),
      sentMessages: messages.map(safeJson),
      notifications: notifications.map(safeJson),
      aiChatHistory: aiHistory.map(safeJson),
      tutorRequestsSent: sentTutorRequests.map(safeJson),
      tutorRequestsReceived: receivedTutorRequests.map(safeJson),
      tutorReviewsWritten: reviews.map(safeJson),
      tutorShortlist: shortlists.map(safeJson),
      coursesTaught: courses.map(safeJson),
      courseEnrollments: enrollments.map(safeJson)
    };

    const filename = `edusetu-data-export-${userId}-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('[Account Export] Failed:', error.message);
    return errorResponse(res, 500, 'Could not generate your data export. Please contact support.');
  }
};

/**
 * Permanently delete the authenticated account and cascade-owned records.
 * Requires the account password and an explicit confirmation phrase.
 * @route DELETE /api/account
 */
const deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body || {};

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return errorResponse(res, 400, 'Type DELETE MY ACCOUNT to confirm permanent account deletion');
    }

    if (!password || typeof password !== 'string') {
      return errorResponse(res, 400, 'Password is required to delete your account');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return errorResponse(res, 404, 'Account not found');

    if (user.role === 'admin') {
      return errorResponse(res, 403, 'Administrator accounts cannot be deleted from the self-service endpoint. Contact the system owner.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password || '');
    if (!passwordMatches) {
      return errorResponse(res, 401, 'Password is incorrect');
    }

    const originalEmail = user.email;
    await user.destroy();
    clearAuthCookies(res);

    console.info('[Account Deletion] Account permanently deleted:', { userId: req.user.id, role: req.user.role, email: originalEmail });
    return successResponse(res, 200, 'Your account and associated records have been deleted');
  } catch (error) {
    console.error('[Account Deletion] Failed:', error.message);
    return errorResponse(res, 500, 'Could not delete your account. Please contact support.');
  }
};

module.exports = {
  exportAccountData,
  deleteAccount
};
