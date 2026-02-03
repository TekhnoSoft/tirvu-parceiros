const { User, Partner, Lead, Transaction } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getPartnerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const partner = await Partner.findOne({ where: { userId } });

    if (!partner) {
      return res.status(404).json({ message: 'Partner profile not found' });
    }

    // KPIs
    // Total accumulated earnings (credits) from closed sales
    const totalEarnings = await Lead.sum('commissionValue', {
      where: {
        partnerId: partner.id,
        saleClosed: true
      }
    }) || 0;

    const leadsCount = await Lead.count({ where: { partnerId: partner.id } });
    const convertedLeads = await Lead.count({ where: { partnerId: partner.id, status: 'converted' } });
    
    // Financials from Leads (Sales Volume)
    const totalSales = await Lead.sum('saleValue', { 
      where: { 
        partnerId: partner.id, 
        saleClosed: true 
      } 
    }) || 0;

    // Financials: Received = Commissions from leads with 'payment_made' status
    // Also include Transaction debits if any (hybrid approach)
    const commissionsReceived = await Lead.sum('commissionValue', { 
      where: { 
        partnerId: partner.id, 
        saleClosed: true,
        paymentStatus: 'payment_made'
      } 
    }) || 0;

    const transactionDebits = await Transaction.sum('amount', { 
      where: { 
        partnerId: partner.id, 
        type: 'debit' 
      } 
    }) || 0;

    const totalReceived = Number(commissionsReceived) + Number(transactionDebits);

    const balance = Number(totalEarnings) - Number(totalReceived);

    // Recent Transactions
    const recentTransactions = await Transaction.findAll({
      where: { partnerId: partner.id },
      order: [['date', 'DESC']],
      limit: 5
    });

    res.json({
      kpis: {
        totalEarnings,
        leadsCount,
        convertedLeads,
        conversionRate: leadsCount > 0 ? ((convertedLeads / leadsCount) * 100).toFixed(2) : 0,
        totalSales,
        totalReceived,
        balance
      },
      recentTransactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    // Helper filter to exclude admins
    const excludeAdminFilter = {
      include: [{
        model: User,
        where: { role: { [Op.ne]: 'admin' } }
      }]
    };

    // Partner Stats
    const totalPartners = await Partner.count({ ...excludeAdminFilter });
    const approvedPartners = await Partner.count({ 
      where: { status: 'approved' },
      ...excludeAdminFilter
    });
    const pendingPartners = await Partner.count({ 
      where: { status: 'pending' },
      ...excludeAdminFilter
    });
    const rejectedPartners = await Partner.count({ 
      where: { status: 'rejected' },
      ...excludeAdminFilter
    });

    // Lead Stats
    const totalLeads = await Lead.count();
    const convertedLeads = await Lead.count({ where: { status: 'converted' } });
    const notConvertedLeads = totalLeads - convertedLeads;

    // Financial Stats
    // Total Sales Volume (GMV)
    const totalSales = await Lead.sum('saleValue', { where: { saleClosed: true } }) || 0;

    // Total Commissions Generated (Total Liability)
    const totalCommissions = await Lead.sum('commissionValue', { 
      where: { saleClosed: true } 
    }) || 0;

    // Total Paid
    // 1. Commissions marked as 'payment_made'
    const commissionsPaid = await Lead.sum('commissionValue', { 
      where: { 
        saleClosed: true,
        paymentStatus: 'payment_made'
      } 
    }) || 0;

    // 2. Manual Transaction Debits
    const transactionDebits = await Transaction.sum('amount', { where: { type: 'debit' } }) || 0;

    const totalPaid = Number(commissionsPaid) + Number(transactionDebits);
    
    // Total Payable (Pending)
    const totalPayable = Number(totalCommissions) - Number(totalPaid);

    // Recent Activity (New Partners)
    const recentPartners = await Partner.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: User, 
        attributes: ['name', 'email'],
        where: { role: { [Op.ne]: 'admin' } }
      }]
    });

    // Leads by State (UF) - Alterado para Parceiros por UF conforme feedback
    const partnersByState = await Partner.findAll({
      attributes: [
        'uf',
        [sequelize.fn('COUNT', sequelize.col('Partner.id')), 'count']
      ],
      include: [{
        model: User,
        attributes: [],
        where: { role: { [Op.ne]: 'admin' } }
      }],
      group: ['uf'],
      raw: true
    });

    res.json({
      partnerStats: {
        total: totalPartners,
        approved: approvedPartners,
        pending: pendingPartners,
        rejected: rejectedPartners
      },
      leadStats: {
        total: totalLeads,
        converted: convertedLeads,
        notConverted: notConvertedLeads
      },
      partnersByState,
      financialStats: {
        totalSales,
        totalCommissions,
        totalPaid,
        totalPayable
      },
      recentPartners
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
