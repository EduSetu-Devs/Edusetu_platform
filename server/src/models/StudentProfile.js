const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * StudentProfile Model Definition
 * Contains academic and personal profile details specific to student accounts.
 */
const StudentProfile = sequelize.define(
  'StudentProfile',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        name: 'unique_user_student_profile',
        msg: 'A student profile already exists for this user account'
      },
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    studentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'unique_student_id',
        msg: 'Student ID must be unique'
      },
      validate: {
        notNull: { msg: 'Student ID is required' },
        notEmpty: { msg: 'Student ID cannot be empty' }
      }
    },
    className: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    section: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    rollNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: ''
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ageVerificationStatus: {
      type: DataTypes.ENUM('unverified', 'pending', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'unverified'
    },
    ageVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ageVerifiedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'student_profiles',
    timestamps: true
  }
);

module.exports = StudentProfile;
