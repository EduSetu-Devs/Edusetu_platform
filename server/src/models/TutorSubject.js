const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TutorSubject Model Definition
 * Represents specific subject expertise and grade level specializations for a Tutor.
 */
const TutorSubject = sequelize.define(
  'TutorSubject',
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
    subjectName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Subject name is required' },
        notEmpty: { msg: 'Subject name cannot be empty' }
      }
    },
    gradeLevels: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'tutor_subjects',
    timestamps: true,
    indexes: [
      { fields: ['tutorProfileId'] },
      { fields: ['subjectName'] }
    ]
  }
);

module.exports = TutorSubject;
