const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ClassFeedback = sequelize.define('ClassFeedback', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teachingSessionId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'teaching_sessions', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  authorUserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  understandingLevel: { type: DataTypes.STRING(50), allowNull: false },
  feedback: { type: DataTypes.TEXT, allowNull: false },
  improvementTopics: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
  homeworkRecommendation: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' }
}, { tableName: 'class_feedback', timestamps: true });

module.exports = ClassFeedback;
