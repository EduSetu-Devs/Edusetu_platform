const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  sendTutorRequest,
  getTutorAssignmentEligibility,
  getMyRequests,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest
} = require('../controllers/tutorRequestController');

router.use(authMiddleware);

router.get('/assignment-eligibility', authorizeRoles('student', 'parent'), getTutorAssignmentEligibility);
// Requester endpoints (student, parent, school)
router.post('/requests', authorizeRoles('student', 'parent'), sendTutorRequest);
router.get('/my-requests', authorizeRoles('student', 'parent'), getMyRequests);
router.put('/requests/:id/cancel', authorizeRoles('student', 'parent'), cancelRequest);

// Tutor endpoints (teacher)
router.get('/incoming-requests', authorizeRoles('teacher'), getIncomingRequests);
router.put('/requests/:id/accept', authorizeRoles('teacher'), acceptRequest);
router.put('/requests/:id/reject', authorizeRoles('teacher'), rejectRequest);

module.exports = router;
