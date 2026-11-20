const { AIUsageDaily } = require('../models');
const { errorResponse } = require('../utils/responseHandler');

const readLimit = (name, fallback) => {
  const value = parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Enforces a per-user daily AI request cap and a global daily cap.
 * Only applies when a paid provider is configured; mock responses are free.
 */
const aiQuota = async (req, res, next) => {
  if (process.env.AI_PROVIDER !== 'openai') return next();
  if (!req.user?.id) return errorResponse(res, 401, 'Authentication required');

  const userLimit = readLimit('AI_DAILY_USER_LIMIT', 40);
  const globalLimit = readLimit('AI_DAILY_GLOBAL_LIMIT', 2000);
  const usageDate = todayKey();

  let usage;
  try {
    const [record, created] = await AIUsageDaily.findOrCreate({
      where: { userId: req.user.id, usageDate },
      defaults: { requestCount: 1 }
    });
    usage = record;

    if (!created) {
      if (record.requestCount >= userLimit) {
        return errorResponse(res, 429, 'Daily AI limit reached. Please try again tomorrow.');
      }
      await record.increment('requestCount');
      await record.reload();
    }

    if (usage.requestCount > userLimit) {
      await usage.decrement('requestCount');
      return errorResponse(res, 429, 'Daily AI limit reached. Please try again tomorrow.');
    }

    const globalTotal = await AIUsageDaily.sum('requestCount', { where: { usageDate } });
    if ((globalTotal || 0) > globalLimit) {
      await usage.decrement('requestCount');
      console.error('[AI Quota] Global daily AI limit reached:', globalTotal);
      return errorResponse(res, 503, 'AI service is temporarily unavailable. Please try again later.');
    }
  } catch (error) {
    console.error('[AI Quota] Failed to record usage:', error.message);
    return errorResponse(res, 503, 'AI service is temporarily unavailable. Please try again later.');
  }

  return next();
};

module.exports = aiQuota;
