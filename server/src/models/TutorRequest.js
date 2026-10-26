const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TutorRequest Model Definition
 * Represents connection/hiring requests sent by Students, Parents, or Schools to a Tutor.
 */
const TutorRequest = sequelize.define(
  'TutorRequest',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    requesterUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Requester user ID is required' }
      }
    },
    requesterRole: {
      type: DataTypes.ENUM('parent', 'student', 'school'),
      allowNull: false,
      validate: {
        notNull: { msg: 'Requester role is required' }
      }
    },
    tutorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tutor_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Tutor profile ID is required' }
      }
    },
    tutorUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Tutor user ID is required' }
      }
    },
    studentProfileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'student_profiles',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Subject is required' },
        notEmpty: { msg: 'Subject cannot be empty' }
      }
    },
    gradeLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    preferredMode: {
      type: DataTypes.ENUM('online', 'offline', 'both'),
      allowNull: false,
      defaultValue: 'online'
    },
    preferredSchedule: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    responseMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    teachingSessionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teaching_sessions',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'tutor_requests',
    timestamps: true,
    indexes: [
      { fields: ['requesterUserId'] },
      { fields: ['tutorProfileId'] },
      { fields: ['tutorUserId'] },
      { fields: ['status'] }
    ]
  }
);

module.exports = TutorRequest;
