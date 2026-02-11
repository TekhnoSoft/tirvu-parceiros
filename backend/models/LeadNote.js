const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Lead = require('./Lead');
const User = require('./User');

const LeadNote = sequelize.define('LeadNote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Lead,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = LeadNote;
