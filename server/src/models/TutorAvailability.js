const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TutorAvailability Model Definition
 * Represents recurring time slots when a tutor is open for booking/classes.
 */
const TutorAvailability = sequelize.define(
  'TutorAvailability',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tutorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tutor_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    dayOfWeek: {
      type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      allowNull: false,
      validate: {
        notNull: { msg: 'Day of week is required' }
      }
    },
    startTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notNull: { msg: 'Start time is required' }
      }
    },
    endTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notNull: { msg: 'End time is required' }
      }
    },
    mode: {
      type: DataTypes.ENUM('online', 'offline', 'both'),
      allowNull: false,
      defaultValue: 'both'
    },
    isSlotActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'tutor_availabilities',
    timestamps: true,
    indexes: [
      { fields: ['tutorProfileId'] },
      { fields: ['dayOfWeek'] }
    ]
  }
);

module.exports = TutorAvailability;
