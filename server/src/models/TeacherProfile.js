const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TeacherProfile Model Definition
 * Represents academic designation, department, and teaching assignments for a Teacher user.
 */
const TeacherProfile = sequelize.define(
  'TeacherProfile',
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
    teacherId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: 'Teacher ID is required' },
        notEmpty: { msg: 'Teacher ID cannot be empty' }
      }
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    subjects: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      get() {
        const val = this.getDataValue('subjects');
        if (!val) return [];
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch (e) {
            return [];
          }
        }
        return Array.isArray(val) ? val : [];
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
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    qualification: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: ''
    },
    experience: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'teacher_profiles',
    timestamps: true
  }
);

module.exports = TeacherProfile;
