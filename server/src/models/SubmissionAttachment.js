const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SubmissionAttachment = sequelize.define(
  'SubmissionAttachment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    submissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'homework_submissions',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    storedFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    storageKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: 'submission_attachments',
    timestamps: true,
    indexes: [{ fields: ['submissionId'] }]
  }
);

module.exports = SubmissionAttachment;
