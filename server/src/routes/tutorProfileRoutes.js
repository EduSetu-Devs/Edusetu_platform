const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getMyTutorProfile,
  upsertTutorProfile,
  manageSubjects,
  manageAvailability,
  submitForVerification
} = require('../controllers/tutorProfileController');

// All endpoints in this router are for teachers / educators managing their tutor presence
router.use(authMiddleware);

router.get('/my-profile', authorizeRoles('teacher'), getMyTutorProfile);
router.post('/profile', authorizeRoles('teacher'), upsertTutorProfile);
router.put('/profile', authorizeRoles('teacher'), upsertTutorProfile);
router.post('/subjects', authorizeRoles('teacher'), manageSubjects);
router.post('/availability', authorizeRoles('teacher'), manageAvailability);
router.post('/submit-verification', authorizeRoles('teacher'), submitForVerification);

module.exports = router;
