const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * CourseEnrollment Model Definition
 * Links a student to an academic course/batch with learning progress and completion status.
 */
const CourseEnrollment = sequelize.define(
  'CourseEnrollment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
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
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'dropped'),
      allowNull: false,
      defaultValue: 'active'
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    completedLessons: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lastAccessedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'course_enrollments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['courseId', 'studentProfileId'],
        name: 'unique_course_student_enrollment'
      }
    ]
  }
);

module.exports = CourseEnrollment;
