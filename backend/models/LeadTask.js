const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Lead = require('./Lead');
const User = require('./User');

const LeadTask = sequelize.define('LeadTask', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  done: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pipedriveId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
});

module.exports = LeadTask;
