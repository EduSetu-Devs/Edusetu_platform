const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ClassNote = sequelize.define('ClassNote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teachingSessionId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'teaching_sessions', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  authorUserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  content: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'class_notes', timestamps: true });

module.exports = ClassNote;
