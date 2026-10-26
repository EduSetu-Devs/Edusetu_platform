const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeachingSessionParticipant = sequelize.define(
  'TeachingSessionParticipant',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teachingSessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'teaching_sessions', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    role: {
      type: DataTypes.ENUM('teacher', 'student'),
      allowNull: false
    },
    joinedAt: { type: DataTypes.DATE, allowNull: false },
    leftAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: 'teaching_session_participants',
    timestamps: true,
    indexes: [{ unique: true, fields: ['teachingSessionId', 'userId'] }, { fields: ['teachingSessionId', 'role'] }]
  }
);

module.exports = TeachingSessionParticipant;