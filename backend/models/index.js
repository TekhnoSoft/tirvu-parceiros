const sequelize = require('../config/database');
const User = require('./User');
const Partner = require('./Partner');
const Lead = require('./Lead');
const Transaction = require('./Transaction');
const Material = require('./Material');
const LeadNote = require('./LeadNote');
const LeadTask = require('./LeadTask');
const Message = require('./Message');

// Associations are already defined in individual files, but we can double check or centralize here if needed.
// However, requiring them executes the association logic in those files.
// It's safer to define them here to avoid circular dependency issues if they arise.

// Re-defining associations here for clarity and safety
User.hasOne(Partner, { foreignKey: 'userId' });
Partner.belongsTo(User, { foreignKey: 'userId' });

Partner.hasMany(Lead, { foreignKey: 'partnerId' });
Lead.belongsTo(Partner, { foreignKey: 'partnerId' });

Partner.hasMany(Transaction, { foreignKey: 'partnerId' });
Transaction.belongsTo(Partner, { foreignKey: 'partnerId' });

Lead.hasMany(LeadNote, { foreignKey: 'leadId', as: 'notes' });
LeadNote.belongsTo(Lead, { foreignKey: 'leadId' });
LeadNote.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Lead.hasMany(LeadTask, { foreignKey: 'leadId', as: 'tasks' });
LeadTask.belongsTo(Lead, { foreignKey: 'leadId' });
LeadTask.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

// Message Associations
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'receiverId' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });

module.exports = {
  sequelize,
  User,
  Partner,
  Lead,
  Transaction,
  Material,
  LeadNote,
  LeadTask,
  Message
};
