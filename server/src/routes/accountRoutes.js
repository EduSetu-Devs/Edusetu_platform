const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { exportAccountData, deleteAccount } = require('../controllers/accountController');

const accountActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many account requests. Please try again later.'
  }
});

router.use(authMiddleware);

router.get('/export', accountActionLimiter, exportAccountData);
router.delete('/', accountActionLimiter, deleteAccount);

module.exports = router;
