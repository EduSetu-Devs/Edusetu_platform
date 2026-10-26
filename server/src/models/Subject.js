const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Subject Model Definition
 * Represents academic course subjects (e.g., Mathematics, Science, English).
 */
const Subject = sequelize.define(
  'Subject',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Subject name is required' },
        notEmpty: { msg: 'Subject name cannot be empty' }
      },
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('name', val.trim());
        }
      }
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'unique_subject_code',
        msg: 'Subject code must be unique'
      },
      validate: {
        notNull: { msg: 'Subject code is required' },
        notEmpty: { msg: 'Subject code cannot be empty' }
      },
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('code', val.trim().toUpperCase());
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    }
  },
  {
    tableName: 'subjects',
    timestamps: true
  }
);

module.exports = Subject;
