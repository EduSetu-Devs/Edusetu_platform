const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Homework Model Definition
 * Represents classroom assignments posted for students of a particular class/section.
 */
const Homework = sequelize.define(
  'Homework',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Homework title is required' },
        notEmpty: { msg: 'Homework title cannot be empty' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: 'Homework description is required' },
        notEmpty: { msg: 'Homework description cannot be empty' }
      }
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Subject is required' },
        notEmpty: { msg: 'Subject cannot be empty' }
      }
    },
    className: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Class name is required' },
        notEmpty: { msg: 'Class name cannot be empty' }
      }
    },
    section: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    assignedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        notNull: { msg: 'Assigned date is required' },
        isDate: { msg: 'Valid assigned date format required' }
      }
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: { msg: 'Due date is required' },
        isDate: { msg: 'Valid due date format required' }
      }
    },
    maxMarks: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: { args: [0.01], msg: 'Maximum marks must be greater than zero' }
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'draft'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: {
          args: [['active', 'closed', 'draft']],
          msg: "Status must be 'active', 'closed', or 'draft'"
        }
      }
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'homeworks',
    timestamps: true
  }
);

module.exports = Homework;
