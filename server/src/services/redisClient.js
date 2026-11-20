const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;
let ready = false;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true
    });
    client.on('ready', () => {
      ready = true;
      logger.info('Redis connection ready');
    });
    client.on('error', (err) => {
      ready = false;
      logger.warn({ err: err.message }, 'Redis connection error');
    });
    client.on('end', () => {
      ready = false;
      logger.warn('Redis connection ended');
    });
    client.connect().catch((err) => {
      logger.warn({ err: err.message }, 'Redis initial connect failed; falling back to in-memory stores');
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to initialize Redis client');
    client = null;
  }
}

const isReady = () => Boolean(client && ready);

const getClient = () => (isReady() ? client : null);

module.exports = { getClient, isReady };