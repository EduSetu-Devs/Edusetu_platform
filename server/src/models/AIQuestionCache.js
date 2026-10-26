const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AIQuestionCache = sequelize.define('AIQuestionCache', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cacheKey: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  question: { type: DataTypes.TEXT, allowNull: false },
  depth: { type: DataTypes.STRING(32), defaultValue: 'quick' },
  answer: { type: DataTypes.TEXT, allowNull: false },
  hitCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  lastAccessed: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ai_question_cache',
  timestamps: true,
  indexes: [{ fields: ['cacheKey'] }]
});

module.exports = AIQuestionCache;
