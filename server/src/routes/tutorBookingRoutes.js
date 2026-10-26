const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAvailableSlots,
  createBooking,
  listBookings,
  getBooking,
  updateBookingDecision,
  rescheduleBooking,
  cancelBooking,
  createBookingReport
} = require('../controllers/tutorBookingController');

const router = express.Router();
router.use(authMiddleware);

router.get('/bookings', authorizeRoles('student', 'parent', 'teacher'), listBookings);
router.get('/bookings/:bookingId', authorizeRoles('student', 'parent', 'teacher'), getBooking);
router.get('/requests/:requestId/available-slots', authorizeRoles('student', 'parent'), getAvailableSlots);
router.post('/bookings', authorizeRoles('student', 'parent'), createBooking);
router.patch('/bookings/:bookingId/confirm', authorizeRoles('teacher'), (req, res, next) => {
  req.params.decision = 'confirm';
  next();
}, updateBookingDecision);
router.patch('/bookings/:bookingId/reject', authorizeRoles('teacher'), (req, res, next) => {
  req.params.decision = 'reject';
  next();
}, updateBookingDecision);
router.patch('/bookings/:bookingId/reschedule', authorizeRoles('student', 'parent'), rescheduleBooking);
router.patch('/bookings/:bookingId/cancel', authorizeRoles('student', 'parent', 'teacher'), cancelBooking);
router.post('/bookings/:bookingId/reports', authorizeRoles('student', 'parent', 'teacher'), createBookingReport);

module.exports = router;
