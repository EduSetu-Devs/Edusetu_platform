const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TutorShortlist Model Definition
 * Allows Students, Parents, and Schools to bookmark/shortlist Tutors.
 */
const TutorShortlist = sequelize.define(
  'TutorShortlist',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
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
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'tutor_shortlists',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'tutorProfileId'], unique: true }
    ]
  }
);

module.exports = TutorShortlist;
