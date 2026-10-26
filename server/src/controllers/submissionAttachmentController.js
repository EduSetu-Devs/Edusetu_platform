const fs = require('fs');
const path = require('path');
const { SubmissionAttachment, HomeworkSubmission, Homework, StudentProfile } = require('../models');
const { SUBMISSION_UPLOAD_DIR } = require('../middleware/submissionUpload');
const { errorResponse } = require('../utils/responseHandler');

const getAuthorizedAttachment = async (attachmentId, user) => {
  const attachment = await SubmissionAttachment.findByPk(attachmentId, {
    include: [
      {
        model: HomeworkSubmission,
        as: 'submission',
        include: [
          { model: Homework, as: 'homework', attributes: ['id', 'assignedBy'] },
          { model: StudentProfile, as: 'studentProfile', attributes: ['id', 'userId'] }
        ]
      }
    ]
  });

  if (!attachment || !attachment.submission) return { attachment: null, allowed: false };

  const submission = attachment.submission;
  const isAdmin = user.role === 'admin';
  const isOwner = user.role === 'student' && submission.studentProfile?.userId === user.id;
  const isTeacher = user.role === 'teacher' && submission.homework?.assignedBy === user.id;

  return { attachment, allowed: isAdmin || isOwner || isTeacher };
};

const downloadSubmissionAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { attachment, allowed } = await getAuthorizedAttachment(attachmentId, req.user);

    if (!attachment) return errorResponse(res, 404, 'Attachment not found');
    if (!allowed) return errorResponse(res, 403, 'Access denied for this attachment');

    const filePath = path.resolve(SUBMISSION_UPLOAD_DIR, attachment.storageKey);
    if (!filePath.startsWith(`${SUBMISSION_UPLOAD_DIR}${path.sep}`) || !fs.existsSync(filePath)) {
      return errorResponse(res, 404, 'Attachment file is unavailable');
    }

    res.type(attachment.mimeType);
    const forceDownload = req.query.download === '1' || req.query.download === 'true';
    const isViewableInline = attachment.mimeType.startsWith('image/') || attachment.mimeType === 'application/pdf';
    const disposition = (!forceDownload && isViewableInline) ? 'inline' : 'attachment';

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${attachment.originalFilename.replace(/[\\"\r\n]/g, '_')}"`
    );
    return res.sendFile(filePath);
  } catch (error) {
    console.error('[Download Submission Attachment Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve attachment');
  }
};

module.exports = { downloadSubmissionAttachment };
