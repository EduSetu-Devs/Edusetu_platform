const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * ParentStudent Model Definition
 * Represents the mapping / association between a Parent and a Student.
 */
const ParentStudent = sequelize.define(
  'ParentStudent',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parentProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'parent_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Parent profile ID reference is required' }
      }
    },
    studentProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'student_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Student profile ID reference is required' }
      }
    },
    relationship: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Child'
    }
  },
  {
    tableName: 'parent_students',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_parent_student',
        fields: ['parentProfileId', 'studentProfileId']
      }
    ]
  }
);

module.exports = ParentStudent;
