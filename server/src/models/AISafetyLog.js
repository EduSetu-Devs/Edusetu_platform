const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AISafetyLog = sequelize.define('AISafetyLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  inputSnippet: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  violationCategory: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  actionTaken: {
    type: DataTypes.STRING,
    defaultValue: 'BLOCKED_AND_REDIRECTED'
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ai_safety_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['conversationId'] },
    { fields: ['violationCategory'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = AISafetyLog;
