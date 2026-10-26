const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeachingSession = sequelize.define(
  'TeachingSession',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    teacherProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teacher_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    studentProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'student_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'subjects',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    subjectName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    mode: {
      type: DataTypes.ENUM('ONLINE', 'OFFLINE'),
      allowNull: false
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'SCHEDULED'
    },
    bookingStatus: {
      type: DataTypes.ENUM('REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'),
      allowNull: true,
      defaultValue: null
    },
    tutorRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    classRoomId: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'teaching_sessions',
    timestamps: true,
    indexes: [
      { fields: ['teacherProfileId', 'status'] },
      { fields: ['studentProfileId', 'status'] },
      { fields: ['scheduledDate'] }
    ]
  }
);

module.exports = TeachingSession;