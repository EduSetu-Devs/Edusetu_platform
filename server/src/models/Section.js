const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Section Model Definition
 * Represents class sections (e.g. 'A', 'B', 'C') belonging to a specific Class.
 */
const Section = sequelize.define(
  'Section',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Class ID is required' }
      }
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Section name is required' },
        notEmpty: { msg: 'Section name cannot be empty' }
      },
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('name', val.trim().toUpperCase());
        }
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    }
  },
  {
    tableName: 'sections',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_class_section',
        fields: ['classId', 'name']
      }
    ]
  }
);

module.exports = Section;
