const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Attendance Model Definition
 * Represents daily subject attendance records linked to a StudentProfile.
 */
const Attendance = sequelize.define(
  'Attendance',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: { msg: 'Attendance date is required' },
        isDate: { msg: 'Valid date format required' }
      }
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'leave'),
      allowNull: false,
      defaultValue: 'present',
      validate: {
        notNull: { msg: 'Attendance status is required' },
        isIn: {
          args: [['present', 'absent', 'late', 'leave']],
          msg: "Status must be 'present', 'absent', 'late', or 'leave'"
        }
      }
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Subject name is required' },
        notEmpty: { msg: 'Subject cannot be empty' }
      }
    },
    remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    markedBy: {
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
    tableName: 'attendances',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_student_date_subject',
        fields: ['studentProfileId', 'date', 'subject']
      }
    ]
  }
);

module.exports = Attendance;
