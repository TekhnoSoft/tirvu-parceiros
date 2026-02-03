const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { auth, authorize } = require('../middleware/auth');

// Rotas protegidas (auth required)
router.use(auth);

// Rotas para o próprio parceiro gerenciar seu perfil
// GET /partners/profile -> Retorna dados do parceiro logado
// PUT /partners/profile -> Atualiza dados do parceiro logado
router.get('/profile', authorize(['partner', 'admin']), partnerController.getProfile);
router.put('/profile', authorize(['partner', 'admin']), partnerController.updateProfile);

// Rotas administrativas (apenas admin)
router.get('/', authorize(['admin']), partnerController.listPartners);
router.put('/:id/approve', authorize(['admin']), partnerController.approvePartner);
router.put('/:id/reject', authorize(['admin']), partnerController.rejectPartner);

module.exports = router;
