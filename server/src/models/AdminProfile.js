const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * AdminProfile Model Definition
 * Stores institutional administration metadata for Admin users.
 */
const AdminProfile = sequelize.define(
  'AdminProfile',
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
      onUpdate: 'CASCADE'
    },
    adminId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        name: 'unique_admin_id',
        msg: 'Admin ID must be unique'
      },
      validate: {
        notNull: { msg: 'Admin ID is required' },
        notEmpty: { msg: 'Admin ID cannot be empty' }
      }
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'System Administrator'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Administration'
    }
  },
  {
    tableName: 'admin_profiles',
    timestamps: true
  }
);

module.exports = AdminProfile;
