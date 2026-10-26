const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * AuditLog Model Definition
 * Tracks administrative governance operations and configuration audits.
 */
const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    adminUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'audit_logs',
    timestamps: true
  }
);

module.exports = AuditLog;
