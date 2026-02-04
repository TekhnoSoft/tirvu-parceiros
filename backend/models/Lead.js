const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Partner = require('./Partner');

const Lead = sequelize.define('Lead', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  type: {
    type: DataTypes.ENUM('PF', 'PJ'),
    defaultValue: 'PF'
  },
  document: {
    type: DataTypes.STRING,
    allowNull: true // CPF or CNPJ
  },
  observation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'contact', 'negotiation', 'converted', 'lost'),
    defaultValue: 'new'
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  saleClosed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('awaiting_payment', 'payment_made'),
    allowNull: true
  },
  saleValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  commissionPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  commissionValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  commissionProof: {
    type: DataTypes.TEXT('long'), // Base64 do comprovante
    allowNull: true
  }
});

Lead.belongsTo(Partner, { foreignKey: 'partnerId' });
Partner.hasMany(Lead, { foreignKey: 'partnerId' });

module.exports = Lead;
