const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Conversation Model Definition
 * Represents a dedicated communication channel between a Teacher and a Parent regarding a specific Student.
 */
const Conversation = sequelize.define(
  'Conversation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    teacherProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teacher_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Teacher profile ID reference is required' }
      }
    },
    parentProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'parent_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Parent profile ID reference is required' }
      }
    },
    studentProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'student_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Student profile ID reference is required' }
      }
    },
    lastMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_teacher_parent_student_conversation',
        fields: ['teacherProfileId', 'parentProfileId', 'studentProfileId']
      }
    ]
  }
);

module.exports = Conversation;
