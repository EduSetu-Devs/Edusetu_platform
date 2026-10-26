const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * HomeworkSubmission Model Definition
 * Represents a student's answer/submission for a specific Homework assignment.
 */
const HomeworkSubmission = sequelize.define(
  'HomeworkSubmission',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    homeworkId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'homeworks',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'student_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    submissionText: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'submitted', 'late', 'reviewed'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'submitted', 'late', 'reviewed']],
          msg: "Status must be 'pending', 'submitted', 'late', or 'reviewed'"
        }
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    marksObtained: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    teacherFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    gradedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  },
  {
    tableName: 'homework_submissions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_homework_student_submission',
        fields: ['homeworkId', 'studentId']
      }
    ]
  }
);

module.exports = HomeworkSubmission;
