const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TutorReview Model Definition
 * Represents reviews and 1-5 star ratings given to Tutors by verified learners/parents/schools.
 */
const TutorReview = sequelize.define(
  'TutorReview',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tutorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tutor_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    tutorUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    reviewerUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    reviewerRole: {
      type: DataTypes.ENUM('parent', 'student', 'school'),
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Rating must be at least 1' },
        max: { args: [5], msg: 'Rating cannot exceed 5' }
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    teachingSessionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teaching_sessions',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    tutorRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tutor_requests',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'tutor_reviews',
    timestamps: true,
    indexes: [
      { fields: ['tutorProfileId'] },
      { fields: ['reviewerUserId'] },
      { fields: ['rating'] },
      { unique: true, fields: ['teachingSessionId', 'reviewerUserId'], name: 'unique_session_tutor_review' }
    ]
  }
);

module.exports = TutorReview;
