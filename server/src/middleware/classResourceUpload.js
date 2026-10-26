const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { errorResponse } = require('../utils/responseHandler');

const RESOURCE_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/resources');
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['application/pdf', ['.pdf']],
  ['application/vnd.ms-powerpoint', ['.ppt']],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', ['.pptx']],
  ['application/msword', ['.doc']],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['.docx']],
  ['text/plain', ['.txt']],
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['image/webp', ['.webp']]
]);

fs.mkdirSync(RESOURCE_UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESOURCE_UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname || '').toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_TYPES.has(file.mimetype) || !ALLOWED_TYPES.get(file.mimetype).includes(ext)) return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'resource'));
    return cb(null, true);
  }
});

const hasSignature = (file, header) => {
  if (file.mimetype === 'application/pdf') return header.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (file.mimetype === 'image/png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === 'image/webp') return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
  if (file.mimetype.includes('word') || file.mimetype.includes('powerpoint')) return header.subarray(0, 2).toString() === 'PK';
  if (file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.ms-powerpoint') return header.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1';
  return file.mimetype === 'text/plain';
};

const cleanup = (files = []) => files.forEach((file) => file?.path && fs.unlink(file.path, () => {}));
const uploadClassResource = (req, res, next) => upload.single('resource')(req, res, async (error) => {
  if (error) {
    cleanup(req.file ? [req.file] : []);
    if (error.code === 'LIMIT_FILE_SIZE') return errorResponse(res, 413, 'Resource must be 25 MB or smaller');
    return errorResponse(res, 400, 'Only PDF, PPT, PPTX, DOC, DOCX, TXT, JPG, PNG, and WEBP resources are allowed');
  }
  if (!req.file) return errorResponse(res, 400, 'A resource file is required');
  try {
    const handle = await fs.promises.open(req.file.path, 'r');
    const header = Buffer.alloc(16);
    await handle.read(header, 0, header.length, 0);
    await handle.close();
    if (!hasSignature(req.file, header)) {
      cleanup([req.file]);
      return errorResponse(res, 400, 'Resource content does not match its declared file type');
    }
    return next();
  } catch {
    cleanup([req.file]);
    return errorResponse(res, 400, 'Resource validation failed');
  }
});

module.exports = { uploadClassResource, cleanupResource: cleanup, RESOURCE_UPLOAD_DIR };
