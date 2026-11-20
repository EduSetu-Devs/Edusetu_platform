const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Daily AI request counters, used to enforce per-user and global spend caps.
 * One row per user per UTC day.
 */
const AIUsageDaily = sequelize.define('AIUsageDaily', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  usageDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  requestCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'ai_usage_daily',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'usageDate'] },
    { fields: ['usageDate'] }
  ]
});

module.exports = AIUsageDaily;
