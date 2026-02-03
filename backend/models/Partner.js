const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  phone: {
    type: DataTypes.STRING
  },
  uf: {
    type: DataTypes.STRING(2)
  },
  city: {
    type: DataTypes.STRING
  },
  pixKey: {
    type: DataTypes.STRING
  },
  pixKeyType: {
    type: DataTypes.ENUM('cpf', 'cnpj', 'email', 'phone', 'random'),
    allowNull: true
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

Partner.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Partner, { foreignKey: 'userId' });

module.exports = Partner;
