const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { auth, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas de leitura (Admin e Parceiro)
router.get('/', materialController.getAllMaterials);

// Rotas de escrita (Apenas Admin)
router.post('/', authorize(['admin']), materialController.createMaterial);
router.put('/:id', authorize(['admin']), materialController.updateMaterial);
router.delete('/:id', authorize(['admin']), materialController.deleteMaterial);

module.exports = router;
