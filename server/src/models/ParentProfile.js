const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * ParentProfile Model Definition
 * Represents parent/guardian details and identity for a Parent user.
 */
const ParentProfile = sequelize.define(
  'ParentProfile',
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
    parentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: 'Parent ID is required' },
        notEmpty: { msg: 'Parent ID cannot be empty' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    relationship: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Parent'
    },
    occupation: {
      type: DataTypes.STRING(100),
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
    tableName: 'parent_profiles',
    timestamps: true
  }
);

module.exports = ParentProfile;
