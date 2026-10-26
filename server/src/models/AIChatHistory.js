const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AIChatHistory = sequelize.define('AIChatHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  conversationId: { type: DataTypes.STRING(64), allowNull: true },
  question: { type: DataTypes.TEXT, allowNull: false },
  answer: { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: 'ai_chat_history',
  timestamps: true,
  indexes: [{ fields: ['userId', 'createdAt'] }, { fields: ['conversationId'] }]
});

module.exports = AIChatHistory;
