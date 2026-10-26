const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Message Model Definition
 * Represents an individual message exchanged in a conversation.
 */
const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Conversation ID reference is required' }
      }
    },
    senderUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Sender User ID reference is required' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: 'Message text is required' },
        notEmpty: { msg: 'Message text cannot be empty' },
        len: {
          args: [1, 2000],
          msg: 'Message length must be between 1 and 2000 characters'
        }
      }
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
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['conversationId']
      },
      {
        fields: ['senderUserId']
      },
      {
        fields: ['isRead']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

module.exports = Message;
