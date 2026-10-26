const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getPendingTutorVerifications,
  verifyTutor,
  rejectTutorVerification
} = require('../controllers/adminTutorController');

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/pending', getPendingTutorVerifications);
router.put('/:id/verify', verifyTutor);
router.put('/:id/reject', rejectTutorVerification);

module.exports = router;
