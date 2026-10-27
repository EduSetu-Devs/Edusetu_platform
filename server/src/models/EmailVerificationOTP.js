const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EmailVerificationOTP = sequelize.define('EmailVerificationOTP', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    set(val) {
      if (typeof val === 'string') {
        this.setDataValue('email', val.trim().toLowerCase());
      }
    }
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON serialized registration request payload'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'email_verification_otps',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['expiresAt'] }
  ]
});

module.exports = EmailVerificationOTP;
