const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Marks Model Definition
 * Represents academic evaluation scores and test results for a student.
 */
const Marks = sequelize.define(
  'Marks',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'student_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Student ID reference is required' }
      }
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Subject is required' },
        notEmpty: { msg: 'Subject cannot be empty' }
      }
    },
    examType: {
      type: DataTypes.ENUM('unit_test', 'mid_term', 'final_exam', 'assignment', 'practical', 'quiz'),
      allowNull: false,
      validate: {
        notNull: { msg: 'Exam type is required' },
        isIn: {
          args: [['unit_test', 'mid_term', 'final_exam', 'assignment', 'practical', 'quiz']],
          msg: "Exam type must be 'unit_test', 'mid_term', 'final_exam', 'assignment', 'practical', or 'quiz'"
        }
      }
    },
    examName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Exam name is required' },
        notEmpty: { msg: 'Exam name cannot be empty' }
      }
    },
    maxMarks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      validate: {
        notNull: { msg: 'Maximum marks is required' },
        isDecimal: { msg: 'Maximum marks must be a valid number' },
        min: {
          args: [0.01],
          msg: 'Maximum marks must be greater than 0'
        }
      }
    },
    obtainedMarks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      validate: {
        notNull: { msg: 'Obtained marks is required' },
        isDecimal: { msg: 'Obtained marks must be a valid number' },
        min: {
          args: [0],
          msg: 'Obtained marks cannot be negative'
        },
        isLessThanOrEqualToMax(value) {
          if (Number(value) > Number(this.maxMarks)) {
            throw new Error('Obtained marks cannot exceed maximum marks');
          }
        }
      }
    },
    examDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: { msg: 'Valid exam date format required (YYYY-MM-DD)' }
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    markedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  },
  {
    tableName: 'marks',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_student_subject_examtype_examname',
        fields: ['studentId', 'subject', 'examType', 'examName']
      }
    ]
  }
);

module.exports = Marks;
