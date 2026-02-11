const Lead = require('../models/Lead');
const LeadNote = require('../models/LeadNote');
const LeadTask = require('../models/LeadTask');
const Partner = require('../models/Partner');
const User = require('../models/User');
const whatsappService = require('../services/whatsappService');
const { Op } = require('sequelize');
const sequelize = require('../config/database'); // Import sequelize for literals
const axios = require('axios');

exports.create = async (req, res) => {
  try {
    const { name, email, phone, company, type, document, value, status, observation, numberOfEmployees, speakOnBehalf } = req.body;
    
    // Se for admin, pode passar o partnerId no body, senão pega do usuário logado
    let partnerId = req.body.partnerId;

    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId: req.user.id } });
      if (!partner) {
        return res.status(404).json({ message: 'Parceiro não encontrado para este usuário.' });
      }
      partnerId = partner.id;

      // Verificar limite de desmarcação de "falar em meu nome"
      if (speakOnBehalf === false) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const count = await Lead.count({
          where: {
            partnerId: partner.id,
            speakOnBehalf: false,
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          }
        });

        if (count >= 10) {
          return res.status(400).json({ message: 'Você atingiu o limite mensal de 10 leads sem autorização para a Tirvu falar em seu nome.' });
        }
      }
    } else if (!partnerId) {
      // Se for admin e não enviou partnerId, tenta encontrar um partner associado ao admin
      let adminPartner = await Partner.findOne({ where: { userId: req.user.id } });
      
      // Se não existir parceiro para o admin, cria um automaticamente
      if (!adminPartner) {
        try {
          adminPartner = await Partner.create({
            userId: req.user.id,
            status: 'approved', // Admin já nasce aprovado
            uf: 'DF', // Default
            city: 'Distrito Federal' // Default
          });
        } catch (partnerError) {
          console.error('Erro ao criar parceiro para admin:', partnerError);
          return res.status(500).json({ message: 'Erro ao criar perfil de parceiro para o administrador.' });
        }
      }

      if (adminPartner) {
        partnerId = adminPartner.id;
      } else {
        return res.status(400).json({ message: 'PartnerId é obrigatório para criação por Admin.' });
      }
    }

    const lead = await Lead.create({
      partnerId,
      name,
      email,
      phone,
      company,
      type,
      document,
      value: value || 0,
      status,
      observation,
      numberOfEmployees,
      speakOnBehalf: speakOnBehalf !== undefined ? speakOnBehalf : true
    });

    // Enviar Webhook N8N
    try {
      const partnerData = await Partner.findByPk(partnerId);
      const partnerUserId = partnerData ? partnerData.userId : null;
      const consultantId = partnerData ? partnerData.consultantId : null;
      
      let partnerName = "";
      let partnerPhone = "";
      
      if (partnerUserId) {
        const partnerUser = await User.findByPk(partnerUserId);
        if (partnerUser) {
          partnerName = partnerUser.name;
        }
      }

      if (partnerData) {
        partnerPhone = partnerData.phone;
      }

      let response = await axios.post('https://tirvu.app.n8n.cloud/webhook-test/tirvu/indicacoes/novo', {
        indicacao_id: lead.id,
        partner_id: partnerUserId ? partnerUserId : 0,
        nome: name,
        email: email,
        telefone: phone,
        empresa: company || "",
        cargo: "", // Campo não existente no modelo
        observacao: observation || "",
        quantidade_funcionarios: numberOfEmployees || "",
        pode_falar_em_nome: speakOnBehalf !== undefined ? speakOnBehalf : true,
        consultor_id: consultantId || 0,
        nome_parceiro: partnerName,
        telefone_parceiro: partnerPhone,
      });

      console.log(response);
    } catch (error) {
      console.log(error);
      console.error('Erro ao enviar webhook N8N:', error.message);
    }

    res.status(201).json(lead);
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ message: 'Erro ao criar lead.' });
  }
};

exports.list = async (req, res) => {
  try {
    const { startDate, endDate, partnerId } = req.query;
    const whereClause = {};

    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId: req.user.id } });
      if (!partner) {
        return res.status(404).json({ message: 'Parceiro não encontrado.' });
      }
      whereClause.partnerId = partner.id;
    } else if (req.user.role === 'consultor') {
      const partners = await Partner.findAll({ 
        where: { consultantId: req.user.id },
        attributes: ['id']
      });
      
      const partnerIds = partners.map(p => p.id);
      
      if (partnerIds.length === 0) {
        return res.json([]);
      }

      if (partnerId) {
        if (partnerIds.includes(Number(partnerId))) {
          whereClause.partnerId = partnerId;
        } else {
          return res.json([]); // Ou 403, mas retornando vazio mantém o padrão de lista vazia
        }
      } else {
        whereClause.partnerId = { [Op.in]: partnerIds };
      }
    } else if (partnerId) {
       // Se for admin e passou partnerId, filtra por ele
       whereClause.partnerId = partnerId;
    }
    
    // Filtro de data
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const leads = await Lead.findAll({
      where: whereClause,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM LeadNotes AS note
              WHERE
                note.leadId = Lead.id
            )`),
            'notesCount'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM LeadTasks AS task
              WHERE
                task.leadId = Lead.id
            )`),
            'tasksCount'
          ]
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: Partner, 
        attributes: ['id', 'uf', 'pixKey', 'pixKeyType'],
        include: [{
          model: User,
          attributes: ['name', 'role']
        }]
      }]
    });

    res.json(leads);
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ message: 'Erro ao listar leads.' });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: 'Lead não encontrado.' });

    // Verificar permissão (Partner só pode ver seus leads, Admin vê tudo, Consultor vê de seus parceiros)
    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId } });
      if (lead.partnerId !== partner.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    } else if (req.user.role === 'consultor') {
      const partner = await Partner.findByPk(lead.partnerId);
      if (!partner || partner.consultantId !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    const note = await LeadNote.create({
      leadId: id,
      userId,
      content
    });

    // Retornar a nota com dados do autor
    const noteWithAuthor = await LeadNote.findByPk(note.id, {
      include: [{ model: User, as: 'author', attributes: ['name', 'role'] }]
    });

    res.status(201).json(noteWithAuthor);
  } catch (error) {
    console.error('Erro ao adicionar nota:', error);
    res.status(500).json({ message: 'Erro ao adicionar nota.' });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: 'Lead não encontrado.' });

    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId: req.user.id } });
      if (lead.partnerId !== partner.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    } else if (req.user.role === 'consultor') {
      const partner = await Partner.findByPk(lead.partnerId);
      if (!partner || partner.consultantId !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    const notes = await LeadNote.findAll({
      where: { leadId: id },
      include: [{ model: User, as: 'author', attributes: ['name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(notes);
  } catch (error) {
    console.error('Erro ao listar notas:', error);
    res.status(500).json({ message: 'Erro ao listar notas.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, type, document, value, status, paymentStatus, saleValue, commissionPercentage, commissionValue, observation, numberOfEmployees, speakOnBehalf } = req.body;

    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: 'Lead não encontrado.' });

    // Verificar permissão
    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId: req.user.id } });
      if (lead.partnerId !== partner.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      // Verificar limite de desmarcação de "falar em meu nome" se estiver alterando para false
      if (speakOnBehalf === false && lead.speakOnBehalf !== false) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const count = await Lead.count({
          where: {
            partnerId: partner.id,
            speakOnBehalf: false,
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          }
        });

        if (count >= 10) {
          return res.status(400).json({ message: 'Você atingiu o limite mensal de 10 leads sem autorização para a Tirvu falar em seu nome.' });
        }
      }
    } else if (req.user.role === 'consultor') {
      const partner = await Partner.findByPk(lead.partnerId);
      if (!partner || partner.consultantId !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    await lead.update({ 
      name, 
      email, 
      phone, 
      company, 
      type, 
      document, 
      value: value || 0, 
      status,
      observation,
      numberOfEmployees,
      speakOnBehalf: speakOnBehalf !== undefined ? speakOnBehalf : lead.speakOnBehalf,
      saleClosed: req.body.saleClosed !== undefined ? req.body.saleClosed : lead.saleClosed,
      paymentStatus: paymentStatus !== undefined ? paymentStatus : lead.paymentStatus,
      saleValue: saleValue !== undefined ? saleValue : lead.saleValue,
      commissionPercentage: commissionPercentage !== undefined ? commissionPercentage : lead.commissionPercentage,
      commissionValue: commissionValue !== undefined ? commissionValue : lead.commissionValue,
      commissionProof: req.body.commissionProof !== undefined ? req.body.commissionProof : lead.commissionProof
    });

    // Notificar parceiro via WhatsApp se a venda for fechada
    if (req.body.saleClosed === true) {
      try {
        const partner = await Partner.findByPk(lead.partnerId, {
          include: [{ model: User, attributes: ['name'] }]
        });

        if (partner && partner.phone) {
          const statusMap = {
            'awaiting_payment': 'Aguardando Pagamento',
            'payment_made': 'Pagamento Efetuado'
          };
          
          const paymentStatusLabel = statusMap[lead.paymentStatus] || lead.paymentStatus;
          
          const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
          };

          let message = `Olá ${partner.User.name}, parabéns! 🎉\n\n`;
          message += `A venda do lead *${lead.name}* foi confirmada!\n\n`;
          message += `💰 Valor da Venda: ${formatCurrency(lead.saleValue)}\n`;
          message += `💵 Sua Comissão: ${formatCurrency(lead.commissionValue)}\n`;
          message += `📊 Status do Pagamento: *${paymentStatusLabel}*\n`;
          
          // Enviar mensagem de texto primeiro
          await whatsappService.sendText(partner.phone, message);

          // Se tiver comprovante, enviar em seguida
          if (lead.paymentStatus === 'payment_made' && lead.commissionProof) {
             // O comprovante é enviado separadamente pois send-document pode não suportar caption
             await whatsappService.sendFile(partner.phone, lead.commissionProof);
          }
        }
      } catch (waError) {
        console.error('Erro ao enviar notificação WhatsApp:', waError);
      }
    }

    res.json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar lead.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: 'Lead não encontrado.' });

    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId: req.user.id } });
      if (lead.partnerId !== partner.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    await lead.destroy();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao deletar lead.' });
  }
};

exports.addTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, duration } = req.body;
    const userId = req.user.id;

    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: 'Lead não encontrado.' });

    // Permissions check
    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId } });
      if (lead.partnerId !== partner.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    } else if (req.user.role === 'consultor') {
      const partner = await Partner.findByPk(lead.partnerId);
      if (!partner || partner.consultantId !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    const task = await LeadTask.create({
      leadId: id,
      userId,
      title,
      description,
      dueDate,
      duration
    });

    const taskWithCreator = await LeadTask.findByPk(task.id, {
      include: [{ model: User, as: 'creator', attributes: ['name', 'role'] }]
    });

    res.status(201).json(taskWithCreator);
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    res.status(500).json({ message: 'Erro ao adicionar tarefa.' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: 'Lead não encontrado.' });

    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ where: { userId: req.user.id } });
      if (lead.partnerId !== partner.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    } else if (req.user.role === 'consultor') {
      const partner = await Partner.findByPk(lead.partnerId);
      if (!partner || partner.consultantId !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    const tasks = await LeadTask.findAll({
      where: { leadId: id },
      include: [{ model: User, as: 'creator', attributes: ['name', 'role'] }],
      order: [['dueDate', 'ASC']] // Tasks usually ordered by due date
    });

    res.json(tasks);
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({ message: 'Erro ao listar tarefas.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await LeadTask.findByPk(taskId);
    if (!task) return res.status(404).json({ message: 'Tarefa não encontrada.' });

    // Check permissions (same as other lead operations, or strictly owner/admin?)
    // For simplicity, using same lead access logic
    const lead = await Lead.findByPk(task.leadId);
    
    if (req.user.role === 'partner') {
        const partner = await Partner.findOne({ where: { userId: req.user.id } });
        if (lead.partnerId !== partner.id) {
          return res.status(403).json({ message: 'Acesso negado.' });
        }
    } else if (req.user.role === 'consultor') {
        const partner = await Partner.findByPk(lead.partnerId);
        if (!partner || partner.consultantId !== req.user.id) {
          return res.status(403).json({ message: 'Acesso negado.' });
        }
    }

    await task.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ message: 'Erro ao deletar tarefa.' });
  }
};
