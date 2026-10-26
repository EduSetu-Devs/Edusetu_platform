const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { errorResponse } = require('../utils/responseHandler');

const SUBMISSION_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/submissions');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = new Map([
  ['application/pdf', ['.pdf']],
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['image/webp', ['.webp']]
]);

fs.mkdirSync(SUBMISSION_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SUBMISSION_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const originalExtension = path.extname(file.originalname || '').toLowerCase();
    const extension = originalExtension || ALLOWED_TYPES.get(file.mimetype)[0];
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  },
  fileFilter: (_req, file, cb) => {
    const expectedExtensions = ALLOWED_TYPES.get(file.mimetype);
    const actualExtension = path.extname(file.originalname || '').toLowerCase();
    if (!expectedExtensions || !expectedExtensions.includes(actualExtension)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'attachments'));
    }
    return cb(null, true);
  }
});

const cleanupUploadedFiles = (files = []) => {
  files.forEach((file) => {
    if (file?.path) fs.unlink(file.path, () => {});
  });
};

const hasValidSignature = (file, header) => {
  if (file.mimetype === 'application/pdf') return header.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (file.mimetype === 'image/png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === 'image/webp') return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
  return false;
};

const uploadSubmissionAttachments = (req, res, next) => {
  upload.array('attachments', MAX_FILES)(req, res, (error) => {
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    req.files = uploadedFiles;

    if (error) {
      cleanupUploadedFiles(uploadedFiles);
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 413, 'Each attachment must be 10 MB or smaller');
      }
      if (error instanceof multer.MulterError) {
        return errorResponse(res, 400, 'Only PDF, JPG, JPEG, PNG, and WEBP attachments are allowed');
      }
      return errorResponse(res, 400, 'Attachment upload failed');
    }
    Promise.all(uploadedFiles.map(async (file) => {
      const handle = await fs.promises.open(file.path, 'r');
      const header = Buffer.alloc(16);
      try {
        await handle.read(header, 0, header.length, 0);
      } finally {
        await handle.close();
      }
      return hasValidSignature(file, header);
    })).then((validFiles) => {
      if (validFiles.some((isValid) => !isValid)) {
        cleanupUploadedFiles(uploadedFiles);
        return errorResponse(res, 400, 'Attachment content does not match an allowed file type');
      }
      return next();
    }).catch(() => {
      cleanupUploadedFiles(uploadedFiles);
      return errorResponse(res, 400, 'Attachment validation failed');
    });
  });
};

module.exports = {
  uploadSubmissionAttachments,
  cleanupUploadedFiles,
  SUBMISSION_UPLOAD_DIR,
  MAX_FILE_SIZE,
  MAX_FILES
};
