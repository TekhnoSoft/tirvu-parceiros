const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { auth, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas de leitura (Admin e Parceiro)
router.get('/', materialController.getAllMaterials);

// Rotas de escrita (Apenas Admin e Consultor)
router.post('/', authorize(['admin', 'consultor']), materialController.createMaterial);
router.put('/:id', authorize(['admin', 'consultor']), materialController.updateMaterial);
router.delete('/:id', authorize(['admin', 'consultor']), materialController.deleteMaterial);

module.exports = router;
