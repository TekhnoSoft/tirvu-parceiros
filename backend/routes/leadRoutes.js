const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { auth, authorize } = require('../middleware/auth');

// Rotas protegidas para parceiros e admins
router.use(auth);
// authorize(['admin', 'partner']) é o padrão esperado se não especificar, 
// mas vamos ser explícitos se necessário. Se authorize filtrar, ok.
// Se authorize(['admin', 'partner']) for usado, ambos passam.

router.get('/', authorize(['admin', 'partner']), leadController.list);
router.post('/', authorize(['admin', 'partner']), leadController.create);
router.put('/:id', authorize(['admin', 'partner']), leadController.update);
router.delete('/:id', authorize(['admin', 'partner']), leadController.delete);

module.exports = router;
