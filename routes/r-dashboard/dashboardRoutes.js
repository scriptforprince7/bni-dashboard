const express = require('express');
const router = express.Router();
const memberController = require('../../controllers/c-dashboard/dashboardController');

// Member routes
router.get('/ro-dashboard', memberController.roDashboard);
router.get('/chapter-dashboard', memberController.chapterDashboard);
router.get('/member-dashboard', memberController.memberDashboard);

module.exports = router;
