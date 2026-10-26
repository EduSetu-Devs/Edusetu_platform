const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { downloadSubmissionAttachment } = require('../controllers/submissionAttachmentController');

router.get('/:attachmentId', authMiddleware, downloadSubmissionAttachment);

module.exports = router;
