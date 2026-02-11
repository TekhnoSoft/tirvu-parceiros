const { User, Partner } = require('../models');
const whatsappService = require('../services/whatsappService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');

exports.listPartners = async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      const whereClause = {};
      
      if (status && status !== 'all') whereClause.status = status;

      // Filter by Consultant
      if (req.user.role === 'consultor') {
        whereClause.consultantId = req.user.id;
      }
  
      if (startDate && endDate) {
        // Garantir que as datas incluam o dia inteiro (início do dia até final do dia)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
  
        whereClause.createdAt = {
          [Op.between]: [start, end]
        };
      }
  
      const partners = await Partner.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
          where: {
            role: { [Op.ne]: 'admin' } // Oculta parceiros que são administradores
          }
        },
        {
          model: User,
          as: 'Consultant',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(partners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar parceiros' });
  }
};

exports.listConsultants = async (req, res) => {
  try {
    const consultants = await User.findAll({
      where: { role: 'consultor' },
      attributes: ['id', 'name', 'email']
    });
    res.json(consultants);
  } catch (error) {
    console.error('Erro ao listar consultores:', error);
    res.status(500).json({ message: 'Erro ao listar consultores' });
  }
};

exports.approvePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { consultantId } = req.body;
    const partner = await Partner.findByPk(id, { include: [User] });

    if (!partner) {
      return res.status(404).json({ message: 'Parceiro não encontrado' });
    }

    if (partner.status === 'approved') {
      return res.status(400).json({ message: 'Parceiro já aprovado' });
    }

    // Gerar senha aleatória
    const rawPassword = crypto.randomBytes(4).toString('hex'); // 8 caracteres
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Atualizar User (senha)
    const user = partner.User;
    user.password = hashedPassword;
    await user.save();

    // Atualizar Partner (status e consultor)
    partner.status = 'approved';
    partner.rejectionReason = null; // Limpar motivo anterior se houver
    if (consultantId) {
      partner.consultantId = consultantId;
    }
    await partner.save();

    // Enviar WhatsApp
    const message = `Olá ${user.name}, sua conta de parceiro Tirvu foi APROVADA! 🎉\n\nAcesse a plataforma em: https://tirvu-parceiros-frontend.vercel.app/\nLogin: ${user.email}\nSenha: ${rawPassword}\n\nBem-vindo ao time!`;
    
    if (partner.phone) {
      await whatsappService.sendText(partner.phone, message);
    }

    res.json({ message: 'Parceiro aprovado com sucesso', password: rawPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao aprovar parceiro' });
  }
};

exports.rejectPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Motivo da reprovação é obrigatório' });
    }

    const partner = await Partner.findByPk(id, { include: [User] });

    if (!partner) {
      return res.status(404).json({ message: 'Parceiro não encontrado' });
    }

    // Atualizar Partner
    partner.status = 'rejected';
    partner.rejectionReason = reason;
    await partner.save();

    // Enviar WhatsApp
    const message = `Olá ${partner.User.name}, sua solicitação de parceria Tirvu foi analisada.\n\nInfelizmente, não foi aprovada neste momento.\nMotivo: ${reason}\n\nQualquer dúvida, entre em contato.`;
    
    if (partner.phone) {
      await whatsappService.sendText(partner.phone, message);
    }

    res.json({ message: 'Parceiro reprovado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao reprovar parceiro' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const partner = await Partner.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    if (!partner) {
      return res.status(404).json({ message: 'Perfil de parceiro não encontrado' });
    }

    res.json(partner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { pixKey, pixKeyType, phone, city, uf } = req.body;
    const partner = await Partner.findOne({ where: { userId: req.user.id } });

    if (!partner) {
      return res.status(404).json({ message: 'Perfil de parceiro não encontrado' });
    }

    // Update allowed fields
    if (pixKey !== undefined) partner.pixKey = pixKey;
    if (pixKeyType !== undefined) partner.pixKeyType = pixKeyType;
    if (phone !== undefined) partner.phone = phone;
    if (city !== undefined) partner.city = city;
    if (uf !== undefined) partner.uf = uf;

    await partner.save();

    res.json(partner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};

exports.registerPartner = async (req, res) => {
  try {
    const { name, email, phone, uf, city } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

    // Create User (with dummy password, will be reset on approval)
    const hashedPassword = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'partner'
    });

    // Create Partner
    await Partner.create({
      userId: user.id,
      phone,
      uf,
      city,
      status: 'pending'
    });

    res.status(201).json({ message: 'Cadastro realizado com sucesso! Aguarde contato.' });
  } catch (error) {
    console.error('Erro ao registrar parceiro:', error);
    res.status(500).json({ message: 'Erro ao realizar cadastro' });
  }
};
