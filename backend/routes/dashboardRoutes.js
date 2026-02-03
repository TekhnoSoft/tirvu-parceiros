const express = require('express');
const router = express.Router();
const { getPartnerDashboard, getAdminDashboard } = require('../controllers/dashboardController');
const { auth, authorize } = require('../middleware/auth');

// Partner Dashboard
router.get('/partner', auth, authorize('partner'), getPartnerDashboard);

// Admin Dashboard
router.get('/admin', auth, authorize('admin'), getAdminDashboard);

module.exports = router;
