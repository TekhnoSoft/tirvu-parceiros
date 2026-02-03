const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Partner = require('./Partner');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Partner,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

Transaction.belongsTo(Partner, { foreignKey: 'partnerId' });
Partner.hasMany(Transaction, { foreignKey: 'partnerId' });

module.exports = Transaction;
