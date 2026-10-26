const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Class Model Definition
 * Represents academic grades/classes (e.g., 'Class 10', 'Grade 9', 'B.Tech CSE').
 */
const Class = sequelize.define(
  'Class',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_class_name',
        msg: 'Class name already exists'
      },
      validate: {
        notNull: { msg: 'Class name is required' },
        notEmpty: { msg: 'Class name cannot be empty' }
      },
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('name', val.trim());
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
    tableName: 'classes',
    timestamps: true
  }
);

module.exports = Class;
