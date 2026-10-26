const { AIQuestionCache } = require('../models');

class AICacheService {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.memoryCache = new Map(); // key -> { answer, depth, hitCount, lastAccessed }
    this.stats = { hits: 0, misses: 0 };
  }

  isTestEnv() {
    return Boolean(
      process.env.NODE_ENV === 'test' ||
      (Array.isArray(process.argv) && process.argv.some((arg) => typeof arg === 'string' && (arg.includes('test') || arg.includes('mocha') || arg.includes('jest'))))
    );
  }

  normalize(question) {
    if (!question || typeof question !== 'string') return '';
    return question
      .toLowerCase()
      .trim()
      .replace(/[?.,!;:~`'"“”‘’()[\]{}]+/g, '')
      .replace(/\s+/g, ' ');
  }

  makeKey(question, depth = 'quick') {
    return `${depth}:${this.normalize(question)}`;
  }

  async get(question, depth = 'quick') {
    if (this.isTestEnv()) {
      return null;
    }

    const key = this.makeKey(question, depth);

    // 1. In-memory check (O(1) lookup, < 1ms)
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      entry.hitCount = (entry.hitCount || 0) + 1;
      entry.lastAccessed = new Date();
      // Re-insert to keep LRU order
      this.memoryCache.delete(key);
      this.memoryCache.set(key, entry);
      this.stats.hits += 1;

      // Update DB asynchronously without awaiting
      AIQuestionCache.increment('hitCount', { where: { cacheKey: key } }).catch(() => {});

      return {
        ...JSON.parse(JSON.stringify(entry.answer)),
        cached: true,
        source: 'memory-cache'
      };
    }

    // 2. Database persistent cache check
    try {
      const dbEntry = await AIQuestionCache.findOne({ where: { cacheKey: key } });
      if (dbEntry) {
        let parsedAnswer;
        try {
          parsedAnswer = JSON.parse(dbEntry.answer);
        } catch {
          parsedAnswer = { explanation: dbEntry.answer, steps: [], summary: dbEntry.answer };
        }

        // Store in memory cache
        this.storeInMemory(key, {
          answer: parsedAnswer,
          depth,
          hitCount: (dbEntry.hitCount || 0) + 1,
          lastAccessed: new Date()
        });

        this.stats.hits += 1;
        dbEntry.increment('hitCount').catch(() => {});

        return {
          ...parsedAnswer,
          cached: true,
          source: 'db-cache'
        };
      }
    } catch (err) {
      console.warn('[AICache] DB lookup warning:', err.message);
    }

    this.stats.misses += 1;
    return null;
  }

  storeInMemory(key, entry) {
    if (this.memoryCache.size >= this.maxSize) {
      // Evict oldest (least recently used)
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(key, entry);
  }

  async set(question, answer, depth = 'quick') {
    if (this.isTestEnv() || !question || !answer) return;
    const key = this.makeKey(question, depth);

    this.storeInMemory(key, {
      answer,
      depth,
      hitCount: 1,
      lastAccessed: new Date()
    });

    // Persist to database asynchronously
    const answerString = typeof answer === 'string' ? answer : JSON.stringify(answer);
    try {
      const [record, created] = await AIQuestionCache.findOrCreate({
        where: { cacheKey: key },
        defaults: {
          cacheKey: key,
          question: question.trim(),
          depth,
          answer: answerString,
          hitCount: 1,
          lastAccessed: new Date()
        }
      });

      if (!created) {
        await record.update({
          answer: answerString,
          lastAccessed: new Date()
        });
      }
    } catch (err) {
      console.warn('[AICache] DB persist warning:', err.message);
    }
  }

  getStats() {
    return {
      size: this.memoryCache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses
    };
  }

  clear() {
    this.memoryCache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
}

const aiCache = new AICacheService();
module.exports = aiCache;
