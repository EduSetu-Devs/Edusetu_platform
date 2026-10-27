const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Course Model Definition
 * Represents academic courses and learning batches offered by teachers/institution.
 */
const Course = sequelize.define(
  'Course',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    teacherProfileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teacher_profiles',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: { msg: 'Course title is required' },
        notEmpty: { msg: 'Course title cannot be empty' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'General'
    },
    gradeLevel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Class 10'
    },
    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    durationWeeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12
    },
    totalLessons: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24
    },
    schedule: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: 'Mon, Wed, Fri · 5:00 PM'
    },
    status: {
      type: DataTypes.ENUM('active', 'upcoming', 'archived'),
      allowNull: false,
      defaultValue: 'active'
    }
  },
  {
    tableName: 'courses',
    timestamps: true
  }
);

module.exports = Course;
