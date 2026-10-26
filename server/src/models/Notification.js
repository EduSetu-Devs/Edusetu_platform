const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Notification Model Definition
 * Represents a system, academic, or communication alert for a specific user.
 */
const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipientUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Recipient User ID reference is required' }
      }
    },
    type: {
      type: DataTypes.ENUM('HOMEWORK', 'ATTENDANCE', 'MARKS', 'MESSAGE', 'GENERAL'),
      allowNull: false,
      defaultValue: 'GENERAL',
      validate: {
        isIn: {
          args: [['HOMEWORK', 'ATTENDANCE', 'MARKS', 'MESSAGE', 'GENERAL']],
          msg: 'Invalid notification type'
        }
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Notification title is required' },
        notEmpty: { msg: 'Notification title cannot be empty' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: 'Notification message is required' },
        notEmpty: { msg: 'Notification message cannot be empty' }
      }
    },
    relatedEntityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    relatedEntityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['recipientUserId']
      },
      {
        fields: ['isRead']
      },
      {
        fields: ['createdAt']
      },
      {
        name: 'idx_recipient_isRead_createdAt',
        fields: ['recipientUserId', 'isRead', 'createdAt']
      }
    ]
  }
);

module.exports = Notification;
