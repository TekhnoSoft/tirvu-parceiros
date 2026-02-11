const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/contacts', chatController.getContacts);
router.get('/messages/:contactId', chatController.getMessages);

module.exports = router;
