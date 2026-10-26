const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TutorProfile Model Definition
 * Represents marketplace profile and discovery information for a Tutor/Teacher.
 */
const TutorProfile = sequelize.define(
  'TutorProfile',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'User ID reference is required' }
      }
    },
    headline: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    qualifications: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    degree: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: ''
    },
    university: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: ''
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Experience cannot be negative' }
      }
    },
    teachingExperience: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    teachingMode: {
      type: DataTypes.ENUM('online', 'offline', 'both'),
      allowNull: false,
      defaultValue: 'both'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'Hourly rate cannot be negative' }
      }
    },
    monthlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    languages: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    resumeUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    certificateUrls: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    demoVideoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    socialLinks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    reviewsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalStudentsTaught: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    verificationStatus: {
      type: DataTypes.ENUM('draft', 'pending_verification', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verifiedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isProfileActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'tutor_profiles',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['city'] },
      { fields: ['area'] },
      { fields: ['teachingMode'] },
      { fields: ['verificationStatus'] },
      { fields: ['hourlyRate'] },
      { fields: ['rating'] },
      { fields: ['isAvailable'] }
    ]
  }
);

module.exports = TutorProfile;
