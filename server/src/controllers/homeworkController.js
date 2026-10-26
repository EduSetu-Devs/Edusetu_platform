const { Op } = require('sequelize');
const { Homework, HomeworkSubmission, SubmissionAttachment, StudentProfile, User, sequelize } = require('../models');
const { cleanupUploadedFiles } = require('../middleware/submissionUpload');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Validates a YYYY-MM-DD date string
 */
const isValidDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
};

/**
 * Helper to get or lazily create a student profile
 */
const getStudentProfileForUser = async (userId) => {
  let profile = await StudentProfile.findOne({ where: { userId } });
  if (!profile) {
    const timestampPart = Date.now().toString().slice(-4);
    profile = await StudentProfile.create({
      userId,
      studentId: `STU${String(userId).padStart(3, '0')}${timestampPart}`
    });
  }
  return profile;
};

const serializeAttachment = (attachment, req) => ({
  id: attachment.id,
  originalFilename: attachment.originalFilename,
  mimeType: attachment.mimeType,
  fileSize: attachment.fileSize,
  createdAt: attachment.createdAt,
  downloadUrl: `${req.protocol}://${req.get('host')}/api/submission-attachments/${attachment.id}`
});

const serializeGrading = (submission, maxMarks) => ({
  marksObtained: submission.marksObtained,
  maxMarks: Number(maxMarks),
  teacherFeedback: submission.teacherFeedback || '',
  gradedAt: submission.gradedAt,
  gradedBy: submission.gradedBy
});

/**
 * Get Student Homework List with Filters and Search
 * @route GET /api/student/homework
 * @query subject (optional)
 * @query status (optional: 'active', 'closed')
 * @query search (optional title search)
 * @query startDate (optional YYYY-MM-DD)
 * @query endDate (optional YYYY-MM-DD)
 */
const getStudentHomework = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentProfile = await getStudentProfileForUser(userId);

    const { subject, status, search, startDate, endDate } = req.query;

    // 1. Validate Date Filters
    if (startDate && !isValidDateString(startDate)) {
      return errorResponse(res, 400, 'Invalid startDate format. Expected YYYY-MM-DD');
    }
    if (endDate && !isValidDateString(endDate)) {
      return errorResponse(res, 400, 'Invalid endDate format. Expected YYYY-MM-DD');
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return errorResponse(res, 400, 'startDate cannot be after endDate');
    }

    // 2. Build Query Condition
    const whereClause = {
      status: { [Op.ne]: 'draft' } // Never expose drafts to students
    };

    // Filter by student's class if set
    if (studentProfile.className && studentProfile.className.trim()) {
      whereClause.className = studentProfile.className.trim();
    }

    // Status filter
    if (status && ['active', 'closed'].includes(status.toLowerCase().trim())) {
      whereClause.status = status.toLowerCase().trim();
    }

    // Subject filter
    if (subject && subject.trim()) {
      whereClause.subject = {
        [Op.like]: `%${subject.trim()}%`
      };
    }

    // Title / description search
    if (search && search.trim()) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // Date range filter on dueDate
    if (startDate && endDate) {
      whereClause.dueDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.dueDate = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.dueDate = { [Op.lte]: endDate };
    }

    // 3. Fetch Homeworks ordered by dueDate ASC
    const homeworks = await Homework.findAll({
      where: whereClause,
      order: [['dueDate', 'ASC'], ['id', 'DESC']],
      attributes: [
        'id',
        'title',
        'description',
        'subject',
        'className',
        'section',
        'assignedDate',
        'dueDate',
        'maxMarks',
        'status',
        'attachmentUrl'
      ]
    });

    // 4. Fetch Submissions for this Student to attach submission status
    const homeworkIds = homeworks.map((hw) => hw.id);
    const submissions = await HomeworkSubmission.findAll({
      where: {
        homeworkId: { [Op.in]: homeworkIds },
        studentId: studentProfile.id
      }
    });

    const submissionMap = new Map();
    submissions.forEach((sub) => {
      submissionMap.set(sub.homeworkId, sub);
    });

    const enrichedHomeworks = homeworks.map((hw) => {
      const sub = submissionMap.get(hw.id);
      return {
        id: hw.id,
        title: hw.title,
        description: hw.description,
        subject: hw.subject,
        className: hw.className,
        section: hw.section || '',
        assignedDate: hw.assignedDate,
        dueDate: hw.dueDate,
        maxMarks: Number(hw.maxMarks),
        status: hw.status,
        attachmentUrl: hw.attachmentUrl || '',
        submissionStatus: sub ? sub.status : 'pending',
        submittedAt: sub ? sub.submittedAt : null
      };
    });

    return successResponse(res, 200, 'Homework list retrieved successfully', enrichedHomeworks);

  } catch (error) {
    console.error('[Get Student Homework Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve homework list');
  }
};

/**
 * Get Homework Details by ID
 * @route GET /api/student/homework/:id
 */
const getHomeworkById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const studentProfile = await getStudentProfileForUser(userId);

    const homework = await Homework.findOne({
      where: {
        id,
        status: { [Op.ne]: 'draft' }
      },
      attributes: [
        'id',
        'title',
        'description',
        'subject',
        'className',
        'section',
        'assignedDate',
        'dueDate',
        'maxMarks',
        'status',
        'attachmentUrl'
      ]
    });

    if (!homework) {
      return errorResponse(res, 404, 'Homework not found');
    }

    // Verify class relevance: if student has a className, ensure homework matches
    if (studentProfile.className && homework.className !== studentProfile.className) {
      return errorResponse(res, 403, 'Access denied. This homework is not assigned to your class.');
    }

    // Fetch student's submission if any
    const submission = await HomeworkSubmission.findOne({
      where: {
        homeworkId: homework.id,
        studentId: studentProfile.id
      },
      attributes: ['id', 'submissionText', 'attachmentUrl', 'submittedAt', 'status', 'remarks', 'marksObtained', 'teacherFeedback', 'gradedAt', 'gradedBy'],
      include: [{ model: SubmissionAttachment, as: 'attachments' }]
    });

    const responseData = {
      ...homework.toJSON(),
      submissionStatus: submission ? submission.status : 'pending',
      submission: submission
        ? {
            ...submission.toJSON(),
          grading: serializeGrading(submission, homework.maxMarks),
            attachments: (submission.attachments || []).map((attachment) => serializeAttachment(attachment, req))
          }
        : null
    };

    return successResponse(res, 200, 'Homework details retrieved successfully', responseData);

  } catch (error) {
    console.error('[Get Homework Details Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve homework details');
  }
};

/**
 * Get Student Submission for a Homework
 * @route GET /api/student/homework/:id/submission
 */
const getStudentSubmission = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const studentProfile = await getStudentProfileForUser(userId);

    const submission = await HomeworkSubmission.findOne({
      where: {
        homeworkId: id,
        studentId: studentProfile.id
      },
      attributes: ['id', 'submissionText', 'attachmentUrl', 'submittedAt', 'status', 'remarks', 'marksObtained', 'teacherFeedback', 'gradedAt', 'gradedBy'],
      include: [{ model: SubmissionAttachment, as: 'attachments' }]
    });

    if (!submission) {
      return successResponse(res, 200, 'No submission found', {
        submissionStatus: 'pending',
        submission: null
      });
    }

    const homework = await Homework.findByPk(id, { attributes: ['maxMarks'] });

    return successResponse(res, 200, 'Submission retrieved successfully', {
      submissionStatus: submission.status,
      submission: {
        ...submission.toJSON(),
        grading: serializeGrading(submission, homework?.maxMarks || 10),
        attachments: (submission.attachments || []).map((attachment) => serializeAttachment(attachment, req))
      }
    });

  } catch (error) {
    console.error('[Get Student Submission Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve submission details');
  }
};

/**
 * Submit Homework Assignment
 * @route POST /api/student/homework/:id/submit
 */
const submitHomework = async (req, res) => {
  let transaction;
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { submissionText, attachmentUrl } = req.body;
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    const cleanSubmissionText = typeof submissionText === 'string' ? submissionText.trim() : '';
    const cleanAttachmentUrl = typeof attachmentUrl === 'string' ? attachmentUrl.trim() : '';
    const studentProfile = await getStudentProfileForUser(userId);

    // 1. Validate submission input
    if (!cleanSubmissionText && !cleanAttachmentUrl && uploadedFiles.length === 0) {
      return errorResponse(res, 400, 'Please provide a comment or at least one attachment');
    }

    // 2. Fetch Homework
    const homework = await Homework.findByPk(id);
    if (!homework || homework.status === 'draft') {
      cleanupUploadedFiles(uploadedFiles);
      return errorResponse(res, 404, 'Homework assignment not found');
    }

    if (homework.status === 'closed') {
      cleanupUploadedFiles(uploadedFiles);
      return errorResponse(res, 400, 'This homework assignment is closed and no longer accepting submissions');
    }

    // Verify class relevance
    if (studentProfile.className && homework.className !== studentProfile.className) {
      cleanupUploadedFiles(uploadedFiles);
      return errorResponse(res, 403, 'Access denied. You cannot submit homework for another class.');
    }

    // 3. Check for existing submission
    const existingSubmission = await HomeworkSubmission.findOne({
      where: {
        homeworkId: homework.id,
        studentId: studentProfile.id
      }
    });

    if (existingSubmission && ['submitted', 'late', 'reviewed'].includes(existingSubmission.status)) {
      cleanupUploadedFiles(uploadedFiles);
      return errorResponse(res, 409, 'You have already submitted this homework assignment');
    }

    // 4. Calculate on-time or late submission
    const now = new Date();
    // Due date comparison: end of the due day in local time
    const dueDateTime = new Date(`${homework.dueDate}T23:59:59`);
    const isLate = now > dueDateTime;
    const submissionStatus = isLate ? 'late' : 'submitted';

    // 5. Create or update submission and attachment metadata atomically
    transaction = await sequelize.transaction();
    let submission;
    if (existingSubmission) {
      existingSubmission.submissionText = cleanSubmissionText;
      existingSubmission.attachmentUrl = cleanAttachmentUrl;
      existingSubmission.submittedAt = now;
      existingSubmission.status = submissionStatus;
      await existingSubmission.save({ transaction });
      submission = existingSubmission;
    } else {
      submission = await HomeworkSubmission.create({
        homeworkId: homework.id,
        studentId: studentProfile.id,
        submissionText: cleanSubmissionText,
        attachmentUrl: cleanAttachmentUrl,
        submittedAt: now,
        status: submissionStatus
      }, { transaction });
    }

    const attachments = [];
    for (const file of uploadedFiles) {
      const attachment = await SubmissionAttachment.create({
        submissionId: submission.id,
        originalFilename: file.originalname,
        storedFilename: file.filename,
        storageKey: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size
      }, { transaction });
      attachments.push(attachment);
    }

    await transaction.commit();

    return successResponse(res, 201, 'Homework submitted successfully', {
      id: submission.id,
      homeworkId: submission.homeworkId,
      status: submission.status,
      submittedAt: submission.submittedAt,
      submissionText: submission.submissionText,
      attachmentUrl: submission.attachmentUrl,
      attachments: attachments.map((attachment) => serializeAttachment(attachment, req))
    });

  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    cleanupUploadedFiles(req.files);
    console.error('[Submit Homework Error]:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 409, 'You have already submitted this homework assignment');
    }
    return errorResponse(res, 500, 'Failed to submit homework assignment');
  }
};

module.exports = {
  getStudentHomework,
  getHomeworkById,
  getStudentSubmission,
  submitHomework
};
