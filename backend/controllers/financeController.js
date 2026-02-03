const { Lead, Transaction, Partner, User } = require('../models');
const { Op } = require('sequelize');

exports.listMovements = async (req, res) => {
  try {
    const { startDate, endDate, partnerId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let leadWhere = { saleClosed: true };
    let transactionWhere = {};

    // Filter by Partner
    if (userRole === 'partner') {
      const partner = await Partner.findOne({ where: { userId } });
      if (!partner) return res.status(404).json({ message: 'Parceiro não encontrado' });
      
      leadWhere.partnerId = partner.id;
      transactionWhere.partnerId = partner.id;
    } else if (partnerId) {
        // Admin filtering by specific partner
        leadWhere.partnerId = partnerId;
        transactionWhere.partnerId = partnerId;
    }

    // Filter by Date
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        leadWhere.updatedAt = { [Op.between]: [start, end] };
        transactionWhere.date = { [Op.between]: [start, end] };
    }

    // Fetch Commissions (Leads)
    const commissions = await Lead.findAll({
        where: leadWhere,
        include: [{ 
            model: Partner, 
            include: [{ model: User, attributes: ['name', 'email'] }]
        }],
        order: [['updatedAt', 'DESC']]
    });

    // Fetch Transactions
    const transactions = await Transaction.findAll({
        where: transactionWhere,
        include: [{ 
            model: Partner, 
            include: [{ model: User, attributes: ['name', 'email'] }]
        }],
        order: [['date', 'DESC']]
    });

    // Normalize and Merge
    const movements = [];

    commissions.forEach(lead => {
        movements.push({
            id: `lead_${lead.id}`,
            originalId: lead.id,
            type: 'commission',
            date: lead.updatedAt,
            description: `Comissão - Venda: ${lead.name}`,
            value: lead.commissionValue,
            status: lead.paymentStatus === 'payment_made' ? 'paid' : 'pending',
            hasProof: !!lead.commissionProof, // Boolean flag
            partnerName: lead.Partner?.User?.name || 'Desconhecido',
            partnerEmail: lead.Partner?.User?.email
        });
    });

    transactions.forEach(trans => {
        movements.push({
            id: `trans_${trans.id}`,
            originalId: trans.id,
            type: trans.type, // 'credit' or 'debit'
            date: trans.date,
            description: trans.description || 'Movimentação Manual',
            value: trans.amount,
            status: 'paid', // Transactions are always "effective"
            hasProof: false,
            partnerName: trans.Partner?.User?.name || 'Desconhecido',
            partnerEmail: trans.Partner?.User?.email
        });
    });

    // Sort combined list by date DESC
    movements.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(movements);

  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    res.status(500).json({ message: 'Erro interno ao listar movimentações' });
  }
};

exports.getProof = async (req, res) => {
    try {
        const { id } = req.params; // lead id
        const userId = req.user.id;
        const userRole = req.user.role;

        const lead = await Lead.findByPk(id);
        if (!lead) return res.status(404).json({ message: 'Lead não encontrado' });
        if (!lead.commissionProof) return res.status(404).json({ message: 'Comprovante não encontrado' });

        // Security check
        if (userRole === 'partner') {
            const partner = await Partner.findOne({ where: { userId } });
            if (lead.partnerId !== partner.id) return res.status(403).json({ message: 'Acesso negado' });
        }

        // Return the Base64 string directly or as a file download
        // Client expects to view/download. We can send the base64 string and let client handle it.
        res.json({ proof: lead.commissionProof });

    } catch (error) {
        console.error('Erro ao buscar comprovante:', error);
        res.status(500).json({ message: 'Erro ao buscar comprovante' });
    }
};
