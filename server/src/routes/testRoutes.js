const express = require('express');
const router = express.Router();
const { testDatabaseConnection, testUserSchema } = require('../controllers/testController');

// GET /api/test/db - Test database connection & ping
router.get('/db', testDatabaseConnection);

// GET /api/test/user-schema - Test User model validation
router.get('/user-schema', testUserSchema);

module.exports = router;
