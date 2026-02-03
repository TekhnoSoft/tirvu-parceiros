const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('image', 'video', 'document', 'link', 'text'),
    defaultValue: 'link'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  thumbnail: {
    type: DataTypes.STRING
  }
});

module.exports = Material;
