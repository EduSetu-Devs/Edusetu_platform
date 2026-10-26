const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getSchoolProfile,
  upsertSchoolProfile,
  searchTeachersForSchool
} = require('../controllers/schoolController');

router.use(authMiddleware);
router.use(authorizeRoles('school'));

router.get('/profile', getSchoolProfile);
router.post('/profile', upsertSchoolProfile);
router.put('/profile', upsertSchoolProfile);
router.get('/tutors', searchTeachersForSchool);

module.exports = router;
