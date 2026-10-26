const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * SchoolProfile Model Definition
 * Represents an educational institution (School, College, Coaching Center) seeking qualified teachers/tutors.
 */
const SchoolProfile = sequelize.define(
  'SchoolProfile',
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
    institutionName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notNull: { msg: 'Institution name is required' },
        notEmpty: { msg: 'Institution name cannot be empty' }
      }
    },
    institutionType: {
      type: DataTypes.ENUM('school', 'college', 'coaching_institute', 'university', 'other'),
      allowNull: false,
      defaultValue: 'school'
    },
    affiliation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    registrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
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
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    contactEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: ''
    },
    contactPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    requiredSubjects: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    requiredQualifications: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'school_profiles',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['city'] },
      { fields: ['institutionType'] }
    ]
  }
);

module.exports = SchoolProfile;
