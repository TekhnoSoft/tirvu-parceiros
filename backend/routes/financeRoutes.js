const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { auth } = require('../middleware/auth');

router.get('/movements', auth, financeController.listMovements);
router.get('/proof/:id', auth, financeController.getProof);

module.exports = router;
