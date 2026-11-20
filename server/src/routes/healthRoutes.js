const express = require('express');
const router = express.Router();
const { getHealth, getDatabaseHealth, getLiveness, getReadiness } = require('../controllers/healthController');

// GET /api/health - Overall server health
router.get('/', getHealth);

// GET /api/health/live - Liveness probe (process up)
router.get('/live', getLiveness);

// GET /api/health/ready - Readiness probe (DB connected)
router.get('/ready', getReadiness);

// GET /api/health/db - Dedicated MySQL / Sequelize database health
router.get('/db', getDatabaseHealth);

module.exports = router;
