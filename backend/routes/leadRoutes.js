const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { auth, authorize } = require('../middleware/auth');

// Rotas protegidas para parceiros e admins
router.use(auth);
// authorize(['admin', 'partner']) é o padrão esperado se não especificar, 
// mas vamos ser explícitos se necessário. Se authorize filtrar, ok.
// Se authorize(['admin', 'partner']) for usado, ambos passam.

router.get('/', authorize(['admin', 'partner', 'consultor']), leadController.list);
router.post('/', authorize(['admin', 'partner', 'consultor']), leadController.create);
router.put('/:id', authorize(['admin', 'partner', 'consultor']), leadController.update);
router.delete('/:id', authorize(['admin', 'partner', 'consultor']), leadController.delete);

// Notes routes
router.get('/:id/notes', authorize(['admin', 'partner', 'consultor']), leadController.getNotes);
router.post('/:id/notes', authorize(['admin', 'partner', 'consultor']), leadController.addNote);

// Tasks routes
router.get('/:id/tasks', authorize(['admin', 'partner', 'consultor']), leadController.getTasks);
router.post('/:id/tasks', authorize(['admin', 'partner', 'consultor']), leadController.addTask);
router.delete('/:id/tasks/:taskId', authorize(['admin', 'partner', 'consultor']), leadController.deleteTask);

module.exports = router;
