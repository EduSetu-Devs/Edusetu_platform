const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

/**
 * User Model Definition using Sequelize (MySQL)
 * Supports student, teacher, parent, school, and admin roles
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Name is required' },
        notEmpty: { msg: 'Name cannot be empty' },
        len: {
          args: [2, 100],
          msg: 'Name must be at least 2 characters long'
        }
      },
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('name', val.trim());
        }
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: {
        name: 'unique_user_email',
        msg: 'Email address is already in use'
      },
      validate: {
        notNull: { msg: 'Email is required' },
        isEmail: { msg: 'Please provide a valid email address' }
      },
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('email', val.trim().toLowerCase());
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Password is required' },
        len: {
          args: [8, 255],
          msg: 'Password must be at least 8 characters long'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('student', 'teacher', 'parent', 'school', 'admin'),
      allowNull: false,
      defaultValue: 'student',
      validate: {
        isIn: {
          args: [['student', 'teacher', 'parent', 'school', 'admin']],
          msg: 'Role must be student, teacher, parent, school, or admin'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '',
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('phone', val.trim());
        } else {
          this.setDataValue('phone', '');
        }
      }
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'users',
    timestamps: true, // Automatically manages createdAt and updatedAt
    underscored: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

// Method to verify submitted password against stored bcrypt hash
User.prototype.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to safely omit password in API JSON outputs
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
