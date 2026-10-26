const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  searchTutors,
  getRecommendedTutors,
  getTutorById,
  compareTutors
} = require('../controllers/tutorDiscoveryController');
const {
  getTutorReviews,
  getReviewableTutorSessions,
  createTutorReview
} = require('../controllers/tutorReviewController');
const {
  toggleShortlist,
  getMyShortlist
} = require('../controllers/tutorShortlistController');

// Public endpoints
router.get('/recommended', authMiddleware, authorizeRoles('student', 'parent'), getRecommendedTutors);
router.get('/', searchTutors);
router.post('/compare', compareTutors);
router.get('/my-shortlist', authMiddleware, authorizeRoles('student', 'parent', 'school'), getMyShortlist);
router.get('/:id', getTutorById);
router.get('/:id/reviews', getTutorReviews);
router.get('/:id/reviewable-sessions', authMiddleware, getReviewableTutorSessions);

// Authenticated interaction endpoints
router.post('/:id/reviews', authMiddleware, createTutorReview);
router.post('/:id/shortlist', authMiddleware, authorizeRoles('student', 'parent', 'school'), toggleShortlist);

module.exports = router;
