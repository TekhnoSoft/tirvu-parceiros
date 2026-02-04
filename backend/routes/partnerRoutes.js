const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { auth, authorize } = require('../middleware/auth');

// Rotas protegidas (auth required)
router.use(auth);

// Rotas para o próprio parceiro gerenciar seu perfil
// GET /partners/profile -> Retorna dados do parceiro logado
// PUT /partners/profile -> Atualiza dados do parceiro logado
router.get('/profile', authorize(['partner', 'admin', 'consultor']), partnerController.getProfile);
router.put('/profile', authorize(['partner', 'admin', 'consultor']), partnerController.updateProfile);

// Rotas administrativas (apenas admin e consultor)
router.get('/consultants', authorize(['admin', 'consultor']), partnerController.listConsultants);
router.get('/', authorize(['admin', 'consultor']), partnerController.listPartners);
router.put('/:id/approve', authorize(['admin', 'consultor']), partnerController.approvePartner);
router.put('/:id/reject', authorize(['admin', 'consultor']), partnerController.rejectPartner);

module.exports = router;
