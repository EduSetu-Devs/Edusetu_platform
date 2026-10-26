const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ClassResource = sequelize.define('ClassResource', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teachingSessionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'teaching_sessions', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  uploadedByUserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  originalFilename: { type: DataTypes.STRING(255), allowNull: false },
  storedFilename: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  mimeType: { type: DataTypes.STRING(120), allowNull: false },
  fileSize: { type: DataTypes.INTEGER, allowNull: false },
  storagePath: { type: DataTypes.STRING(500), allowNull: false },
  uploadedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'class_resources', timestamps: true,
  indexes: [{ fields: ['teachingSessionId'] }, { fields: ['uploadedByUserId'] }]
});

module.exports = ClassResource;
