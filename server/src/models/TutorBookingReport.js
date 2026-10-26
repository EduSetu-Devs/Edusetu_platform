const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TutorBookingReport = sequelize.define(
  'TutorBookingReport',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teachingSessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'teaching_sessions', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    reporterUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    category: {
      type: DataTypes.ENUM('TUTOR_ISSUE', 'STUDENT_ISSUE', 'BOOKING_ISSUE', 'TECHNICAL_ISSUE', 'OTHER'),
      allowNull: false
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('OPEN', 'REVIEWED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'OPEN'
    },
    adminNote: { type: DataTypes.STRING(1000), allowNull: true }
  },
  {
    tableName: 'tutor_booking_reports',
    timestamps: true,
    indexes: [
      { fields: ['teachingSessionId', 'status'] },
      { fields: ['reporterUserId'] }
    ]
  }
);

module.exports = TutorBookingReport;
