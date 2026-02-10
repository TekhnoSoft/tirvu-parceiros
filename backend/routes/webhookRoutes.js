const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/pipedrive', webhookController.handlePipedriveWebhook);

module.exports = router;
