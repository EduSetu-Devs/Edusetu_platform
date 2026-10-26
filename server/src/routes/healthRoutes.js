const express = require('express');
const router = express.Router();
const { getHealth, getDatabaseHealth } = require('../controllers/healthController');

// GET /api/health - Overall server health
router.get('/', getHealth);

// GET /api/health/db - Dedicated MySQL / Sequelize database health
router.get('/db', getDatabaseHealth);

module.exports = router;
