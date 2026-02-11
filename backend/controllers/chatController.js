const { User, Partner, Message } = require('../models');
const { Op } = require('sequelize');

exports.getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let contacts = [];

    // Base query to exclude self and get basic info
    const userAttributes = ['id', 'name', 'email', 'role'];

    if (role === 'admin') {
      // Admin sees everyone
      contacts = await User.findAll({
        where: {
            id: { [Op.ne]: userId }
        },
        attributes: userAttributes,
        order: [['name', 'ASC']]
      });
    } else if (role === 'consultor') {
      // Consultant sees their Partners and all Admins
      // 1. Get Partners linked to this consultant
      const partners = await Partner.findAll({
        where: { consultantId: userId },
        include: [{ model: User, attributes: userAttributes }]
      });
      
      const partnerUsers = partners.map(p => p.User).filter(u => u); // Filter nulls if any

      // 2. Get Admins
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: userAttributes
      });

      // Merge
      contacts = [...partnerUsers, ...admins];

    } else if (role === 'partner') {
      // Partner sees their Consultant and all Admins
      const partnerProfile = await Partner.findOne({
          where: { userId },
          include: [{ model: User, as: 'Consultant', attributes: userAttributes }]
      });

      if (partnerProfile && partnerProfile.Consultant) {
          contacts.push(partnerProfile.Consultant);
      }

      // Get Admins
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: userAttributes
      });

      contacts = [...contacts, ...admins];
    }

    // Remove duplicates and Sort by name
    const uniqueContacts = Array.from(new Map(contacts.map(c => [c.id, c])).values());
    uniqueContacts.sort((a, b) => a.name.localeCompare(b.name));

    res.json(uniqueContacts);

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Erro ao buscar contatos' });
  }
};

exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contactId } = req.params;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: contactId },
                    { senderId: contactId, receiverId: userId }
                ]
            },
            order: [['createdAt', 'ASC']],
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'name'] },
                { model: User, as: 'Receiver', attributes: ['id', 'name'] }
            ]
        });

        // Mark as read (optional optimization: do this async or in a separate call)
        await Message.update({ read: true }, {
            where: {
                senderId: contactId,
                receiverId: userId,
                read: false
            }
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Erro ao buscar mensagens' });
    }
};
