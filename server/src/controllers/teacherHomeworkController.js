const { Op } = require('sequelize');
const fs = require('fs');
const { User, StudentProfile, TeacherProfile, Homework, HomeworkSubmission, SubmissionAttachment, sequelize } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { notifyForHomework } = require('../services/notificationService');
const { SUBMISSION_UPLOAD_DIR } = require('../middleware/submissionUpload');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATUSES = ['active', 'closed', 'draft'];

/**
 * Helper to retrieve teacher profile
 */
const getTeacherProfileForUser = async (userId) => {
  let profile = await TeacherProfile.findOne({ where: { userId } });
  if (!profile) {
    const timestampPart = Date.now().toString().slice(-4);
    profile = await TeacherProfile.create({
      userId,
      teacherId: `TCH${String(userId).padStart(3, '0')}${timestampPart}`
    });
  }
  return profile;
};

/**
 * Create Homework for Teacher's Assigned Class & Section
 * @route POST /api/teacher/homework
 */
const createHomework = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { title, description, subject, dueDate, assignedDate, status, attachmentUrl } = req.body;

    // 1. Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return errorResponse(res, 400, 'Homework title is required');
    }
    if (title.trim().length > 255) {
      return errorResponse(res, 400, 'Homework title cannot exceed 255 characters');
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return errorResponse(res, 400, 'Homework description is required');
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!dueDate || !DATE_REGEX.test(dueDate)) {
      return errorResponse(res, 400, 'Valid due date (YYYY-MM-DD) is required');
    }

    const homeworkStatus = status ? status.toLowerCase() : 'active';
    if (!VALID_STATUSES.includes(homeworkStatus)) {
      return errorResponse(res, 400, `Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const cleanAssignedDate = assignedDate && DATE_REGEX.test(assignedDate)
      ? assignedDate
      : new Date().toISOString().split('T')[0];

    // Auto-derive className and section from TeacherProfile (never trust body)
    const targetClass = teacherProfile.className && teacherProfile.className.trim()
      ? teacherProfile.className.trim()
      : 'Class 10';
    const targetSection = teacherProfile.section && teacherProfile.section.trim()
      ? teacherProfile.section.trim()
      : 'A';

    const homework = await Homework.create({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      className: targetClass,
      section: targetSection,
      assignedBy: userId,
      assignedDate: cleanAssignedDate,
      dueDate,
      status: homeworkStatus,
      attachmentUrl: attachmentUrl || ''
    });

    // Notify students and parents asynchronously
    notifyForHomework(homework).catch((err) =>
      console.error('[Notification Error on createHomework]:', err.message)
    );

    return successResponse(res, 201, 'Homework assignment created successfully', homework);

  } catch (error) {
    console.error('[Create Teacher Homework Error]:', error.message);
    return errorResponse(res, 500, 'Failed to create homework assignment');
  }
};

/**
 * Get All Homework Created by Authenticated Teacher (with filters, search & metrics)
 * @route GET /api/teacher/homework
 */
const getMyHomework = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { search, subject, status, startDate, endDate, fromDate, toDate } = req.query;

    const whereClause = {
      assignedBy: userId
    };

    // Filter by subject
    if (subject && subject.trim()) {
      whereClause.subject = subject.trim();
    }

    // Filter by status
    if (status && VALID_STATUSES.includes(status.toLowerCase())) {
      whereClause.status = status.toLowerCase();
    }

    // Filter by date range (dueDate)
    const filterStart = startDate || fromDate;
    const filterEnd = endDate || toDate;

    if (filterStart && filterEnd) {
      if (!DATE_REGEX.test(filterStart) || !DATE_REGEX.test(filterEnd)) {
        return errorResponse(res, 400, 'Invalid date format. Use YYYY-MM-DD');
      }
      if (filterStart > filterEnd) {
        return errorResponse(res, 400, 'Start date cannot be after end date');
      }
      whereClause.dueDate = { [Op.between]: [filterStart, filterEnd] };
    } else if (filterStart) {
      if (!DATE_REGEX.test(filterStart)) return errorResponse(res, 400, 'Invalid start date format');
      whereClause.dueDate = { [Op.gte]: filterStart };
    } else if (filterEnd) {
      if (!DATE_REGEX.test(filterEnd)) return errorResponse(res, 400, 'Invalid end date format');
      whereClause.dueDate = { [Op.lte]: filterEnd };
    }

    // Search query on title, description, subject
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
        { subject: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    const homeworkList = await Homework.findAll({
      where: whereClause,
      order: [['dueDate', 'DESC'], ['id', 'DESC']]
    });

    // Query total students enrolled in this teacher's class
    const studentWhere = {};
    if (teacherProfile.className && teacherProfile.className.trim()) {
      studentWhere.className = teacherProfile.className.trim();
    }
    if (teacherProfile.section && teacherProfile.section.trim()) {
      studentWhere.section = teacherProfile.section.trim();
    }
    const totalEnrolledStudents = await StudentProfile.count({ where: studentWhere });

    // Fetch submission statistics for each homework
    const formattedList = await Promise.all(
      homeworkList.map(async (hw) => {
        const submissions = await HomeworkSubmission.findAll({
          where: { homeworkId: hw.id },
          attributes: ['status']
        });

        const submitted = submissions.filter((s) => s.status === 'submitted' || s.status === 'reviewed').length;
        const late = submissions.filter((s) => s.status === 'late').length;
        const pending = Math.max(0, totalEnrolledStudents - (submitted + late));

        return {
          id: hw.id,
          title: hw.title,
          description: hw.description,
          subject: hw.subject,
          className: hw.className,
          section: hw.section,
          assignedDate: hw.assignedDate,
          dueDate: hw.dueDate,
          maxMarks: Number(hw.maxMarks),
          status: hw.status,
          attachmentUrl: hw.attachmentUrl,
          totalStudents: totalEnrolledStudents,
          submitted,
          pending,
          late,
          createdAt: hw.createdAt,
          updatedAt: hw.updatedAt
        };
      })
    );

    return successResponse(res, 200, 'Teacher homework assignments retrieved successfully', {
      teacher: {
        teacherId: teacherProfile.teacherId,
        className: teacherProfile.className || 'All Classes',
        section: teacherProfile.section || 'All Sections'
      },
      homework: formattedList,
      count: formattedList.length
    });

  } catch (error) {
    console.error('[Get Teacher Homework Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve homework assignments');
  }
};

/**
 * Get Specific Homework Details
 * @route GET /api/teacher/homework/:id
 */
const getHomeworkDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const homework = await Homework.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!homework) {
      return errorResponse(res, 404, 'Homework assignment not found');
    }

    if (homework.assignedBy !== userId) {
      return errorResponse(res, 403, 'Access denied. You can only view homework created by yourself.');
    }

    // Query total students in this homework's class & section
    const studentWhere = { className: homework.className };
    if (homework.section) studentWhere.section = homework.section;
    const totalStudents = await StudentProfile.count({ where: studentWhere });

    // Fetch submissions
    const submissions = await HomeworkSubmission.findAll({
      where: { homeworkId: homework.id }
    });

    const submitted = submissions.filter((s) => s.status === 'submitted' || s.status === 'reviewed').length;
    const late = submissions.filter((s) => s.status === 'late').length;
    const pending = Math.max(0, totalStudents - (submitted + late));

    const responsePayload = {
      id: homework.id,
      title: homework.title,
      description: homework.description,
      subject: homework.subject,
      className: homework.className,
      section: homework.section,
      assignedBy: homework.assignedBy,
      teacherName: homework.teacher?.name || '',
      assignedDate: homework.assignedDate,
      dueDate: homework.dueDate,
      maxMarks: Number(homework.maxMarks),
      status: homework.status,
      attachmentUrl: homework.attachmentUrl,
      stats: {
        totalStudents,
        submitted,
        pending,
        late
      },
      createdAt: homework.createdAt,
      updatedAt: homework.updatedAt
    };

    return successResponse(res, 200, 'Homework details retrieved successfully', responsePayload);

  } catch (error) {
    console.error('[Get Teacher Homework Details Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve homework details');
  }
};

/**
 * Update Homework Assignment
 * @route PUT /api/teacher/homework/:id
 */
const updateHomework = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, subject, dueDate, status, attachmentUrl } = req.body;

    const homework = await Homework.findByPk(id);

    if (!homework) {
      return errorResponse(res, 404, 'Homework assignment not found');
    }

    if (homework.assignedBy !== userId) {
      return errorResponse(res, 403, 'Access denied. You can only update homework created by yourself.');
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) return errorResponse(res, 400, 'Title cannot be empty');
      homework.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) return errorResponse(res, 400, 'Description cannot be empty');
      homework.description = description.trim();
    }

    if (subject !== undefined) {
      if (typeof subject !== 'string' || !subject.trim()) return errorResponse(res, 400, 'Subject cannot be empty');
      homework.subject = subject.trim();
    }

    if (dueDate !== undefined) {
      if (!DATE_REGEX.test(dueDate)) return errorResponse(res, 400, 'Valid due date (YYYY-MM-DD) is required');
      homework.dueDate = dueDate;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status.toLowerCase())) {
        return errorResponse(res, 400, `Status must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      homework.status = status.toLowerCase();
    }

    if (attachmentUrl !== undefined) {
      homework.attachmentUrl = attachmentUrl;
    }

    await homework.save();

    return successResponse(res, 200, 'Homework assignment updated successfully', homework);

  } catch (error) {
    console.error('[Update Teacher Homework Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update homework assignment');
  }
};

/**
 * Delete / Cancel Homework Assignment
 * @route DELETE /api/teacher/homework/:id
 */
const deleteHomework = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const homework = await Homework.findByPk(id);

    if (!homework) {
      return errorResponse(res, 404, 'Homework assignment not found');
    }

    if (homework.assignedBy !== userId) {
      return errorResponse(res, 403, 'Access denied. You can only delete homework created by yourself.');
    }

    const submissions = await HomeworkSubmission.findAll({
      where: { homeworkId: homework.id },
      include: [{ model: SubmissionAttachment, as: 'attachments', attributes: ['storageKey'] }]
    });

    // Remove physical files before the database cascade removes metadata.
    submissions.flatMap((submission) => submission.attachments || []).forEach((attachment) => {
      fs.unlink(`${SUBMISSION_UPLOAD_DIR}/${attachment.storageKey}`, () => {});
    });

    await homework.destroy();

    return successResponse(res, 200, 'Homework assignment deleted successfully');

  } catch (error) {
    console.error('[Delete Teacher Homework Error]:', error.message);
    return errorResponse(res, 500, 'Failed to delete homework assignment');
  }
};

/**
 * Get All Student Submissions for a Specific Homework / Assignment
 * @route GET /api/teacher/homework/:id/submissions
 * @route GET /api/teacher/assignments/:id/submissions
 */
const getHomeworkSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const homework = await Homework.findByPk(id);

    if (!homework) {
      return errorResponse(res, 404, 'Homework assignment not found');
    }

    if (homework.assignedBy !== userId) {
      return errorResponse(res, 403, 'Access denied. You can only view submissions for your own homework.');
    }

    // Fetch all students in this homework's class & section
    const studentWhere = { className: homework.className };
    if (homework.section) studentWhere.section = homework.section;

    const students = await StudentProfile.findAll({
      where: studentWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
      order: [['rollNumber', 'ASC'], ['studentId', 'ASC']]
    });

    // Fetch submissions for this homework with full attachment objects
    const submissions = await HomeworkSubmission.findAll({
      where: { homeworkId: homework.id },
      include: [{ model: SubmissionAttachment, as: 'attachments' }]
    });

    const submissionMap = new Map();
    submissions.forEach((sub) => {
      submissionMap.set(sub.studentId, sub);
    });

    const studentList = students.map((sp) => {
      const sub = submissionMap.get(sp.id);
      const attachments = sub && Array.isArray(sub.attachments)
        ? sub.attachments.map((att) => ({
            id: att.id,
            originalFilename: att.originalFilename,
            mimeType: att.mimeType,
            fileSize: att.fileSize,
            createdAt: att.createdAt,
            downloadUrl: `${req.protocol}://${req.get('host')}/api/submission-attachments/${att.id}?download=1`,
            viewUrl: `${req.protocol}://${req.get('host')}/api/submission-attachments/${att.id}`
          }))
        : [];

      return {
        studentProfileId: sp.id,
        studentId: sp.studentId,
        name: sp.user?.name || '',
        email: sp.user?.email || '',
        rollNumber: sp.rollNumber || '',
        submissionId: sub ? sub.id : null,
        status: sub ? sub.status : 'pending',
        submissionStatus: sub ? sub.status : 'pending',
        submissionText: sub ? sub.submissionText : '',
        comment: sub ? sub.submissionText : '',
        attachmentUrl: sub ? sub.attachmentUrl : '',
        submittedAt: sub ? sub.submittedAt : null,
        remarks: sub ? sub.remarks : '',
        grading: sub
          ? {
              marksObtained: sub.marksObtained,
              maxMarks: Number(homework.maxMarks),
              teacherFeedback: sub.teacherFeedback || '',
              gradedAt: sub.gradedAt,
              gradedBy: sub.gradedBy
            }
          : {
              marksObtained: null,
              maxMarks: Number(homework.maxMarks),
              teacherFeedback: '',
              gradedAt: null,
              gradedBy: null
            },
        attachmentCount: attachments.length,
        attachments
      };
    });

    const submittedCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'reviewed').length;
    const lateCount = submissions.filter((s) => s.status === 'late').length;
    const pendingCount = Math.max(0, students.length - (submittedCount + lateCount));

    const submittedEntries = studentList
      .filter((s) => s.submissionId !== null)
      .map((s) => ({
        id: s.submissionId,
        student: {
          id: s.studentProfileId,
          studentId: s.studentId,
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber
        },
        comment: s.submissionText || '',
        submissionText: s.submissionText || '',
        submittedAt: s.submittedAt,
        status: s.status,
        attachments: s.attachments || [],
        grading: s.grading
      }));

    const assignmentInfo = {
      id: homework.id,
      title: homework.title,
      description: homework.description,
      subject: homework.subject,
      className: homework.className,
      section: homework.section,
      assignedDate: homework.assignedDate,
      dueDate: homework.dueDate,
      maxMarks: Number(homework.maxMarks),
      deadline: homework.dueDate,
      status: homework.status
    };

    return successResponse(res, 200, 'Homework submissions retrieved successfully', {
      homework: assignmentInfo,
      assignment: assignmentInfo,
      stats: {
        totalStudents: students.length,
        submitted: submittedCount,
        late: lateCount,
        pending: pendingCount
      },
      students: studentList,
      submissions: submittedEntries
    });

  } catch (error) {
    console.error('[Get Homework Submissions Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve homework submissions');
  }
};

/**
 * Get Specific Student's Submission Details
 * @route GET /api/teacher/homework/:homeworkId/submissions/:studentId
 * @route GET /api/teacher/assignments/:homeworkId/submissions/:studentId
 */
const getSubmissionDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { homeworkId, studentId } = req.params;

    const homework = await Homework.findByPk(homeworkId);

    if (!homework) {
      return errorResponse(res, 404, 'Homework assignment not found');
    }

    if (homework.assignedBy !== userId) {
      return errorResponse(res, 403, 'Access denied. You can only view submissions for your own homework.');
    }

    // Find student
    const isNumeric = !isNaN(Number(studentId));
    const studentWhere = {};
    if (isNumeric) {
      studentWhere[Op.or] = [{ id: Number(studentId) }, { studentId: String(studentId) }];
    } else {
      studentWhere.studentId = String(studentId);
    }

    const student = await StudentProfile.findOne({
      where: studentWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    if (!student) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    // Check class authorization
    if (student.className !== homework.className || (homework.section && student.section !== homework.section)) {
      return errorResponse(res, 403, 'Access denied. Student is not in this assignment class/section.');
    }

    const submission = await HomeworkSubmission.findOne({
      where: {
        homeworkId: homework.id,
        studentId: student.id
      },
      include: [{ model: SubmissionAttachment, as: 'attachments' }]
    });

    const assignmentInfo = {
      id: homework.id,
      title: homework.title,
      description: homework.description,
      subject: homework.subject,
      className: homework.className,
      section: homework.section,
      assignedDate: homework.assignedDate,
      dueDate: homework.dueDate,
      deadline: homework.dueDate,
      status: homework.status
    };

    const responsePayload = {
      homework: assignmentInfo,
      assignment: assignmentInfo,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || '',
        email: student.user?.email || '',
        rollNumber: student.rollNumber || ''
      },
      submission: submission
        ? {
            id: submission.id,
            status: submission.status,
            submissionText: submission.submissionText,
            comment: submission.submissionText,
            attachmentUrl: submission.attachmentUrl,
            attachments: (submission.attachments || []).map((attachment) => ({
              id: attachment.id,
              originalFilename: attachment.originalFilename,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
              createdAt: attachment.createdAt,
              downloadUrl: `${req.protocol}://${req.get('host')}/api/submission-attachments/${attachment.id}?download=1`,
              viewUrl: `${req.protocol}://${req.get('host')}/api/submission-attachments/${attachment.id}`
            })),
            submittedAt: submission.submittedAt,
            remarks: submission.remarks,
            grading: {
              marksObtained: submission.marksObtained,
              maxMarks: Number(homework.maxMarks),
              teacherFeedback: submission.teacherFeedback || '',
              gradedAt: submission.gradedAt,
              gradedBy: submission.gradedBy
            }
          }
        : {
            id: null,
            status: 'pending',
            submissionText: '',
            comment: '',
            attachmentUrl: '',
            attachments: [],
            submittedAt: null,
            remarks: ''
          }
    };

    return successResponse(res, 200, 'Submission details retrieved successfully', responsePayload);

  } catch (error) {
    console.error('[Get Submission Details Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve submission details');
  }
};

/**
 * Grade or update a student's submission.
 * @route PATCH /api/teacher/homework/:homeworkId/submissions/:submissionId/grade
 */
const gradeSubmission = async (req, res) => {
  try {
    const { homeworkId, submissionId } = req.params;
    const { marks, feedback } = req.body || {};

    const homework = await Homework.findOne({
      where: { id: homeworkId, assignedBy: req.user.id }
    });

    if (!homework) {
      return errorResponse(res, 404, 'Homework assignment not found');
    }

    const submission = await HomeworkSubmission.findOne({
      where: { id: submissionId, homeworkId: homework.id }
    });

    if (!submission) {
      return errorResponse(res, 404, 'Submission not found for this homework assignment');
    }

    const marksValue = Number(marks);
    const maxMarks = Number(homework.maxMarks);
    if (!Number.isFinite(marksValue)) {
      return errorResponse(res, 400, 'Marks must be numeric');
    }
    if (marksValue < 0) {
      return errorResponse(res, 400, 'Marks cannot be negative');
    }
    if (marksValue > maxMarks) {
      return errorResponse(res, 400, 'Marks cannot exceed maximum marks');
    }
    if (feedback !== undefined && typeof feedback !== 'string') {
      return errorResponse(res, 400, 'Teacher feedback must be text');
    }

    submission.marksObtained = marksValue;
    submission.teacherFeedback = typeof feedback === 'string' ? feedback.trim() : (submission.teacherFeedback || '');
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.id;
    submission.status = 'reviewed';
    await submission.save();

    return successResponse(res, 200, 'Submission grade saved successfully', {
      id: submission.id,
      marksObtained: Number(submission.marksObtained),
      maxMarks,
      teacherFeedback: submission.teacherFeedback || '',
      gradedAt: submission.gradedAt,
      gradedBy: submission.gradedBy,
      status: submission.status
    });
  } catch (error) {
    console.error('[Grade Submission Error]:', error.message);
    return errorResponse(res, 500, 'Failed to save submission grade');
  }
};

module.exports = {
  createHomework,
  getMyHomework,
  getHomeworkDetails,
  updateHomework,
  deleteHomework,
  getHomeworkSubmissions,
  getSubmissionDetails,
  gradeSubmission
};
