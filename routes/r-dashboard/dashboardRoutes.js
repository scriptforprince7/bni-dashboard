const express = require('express');
const router = express.Router();
const memberController = require('../../controllers/c-dashboard/dashboardController');

// Member routes
router.get('/ro-dashboard', memberController.roDashboard);
router.get('/chapter-dashboard', memberController.chapterDashboard);
router.get('/member-dashboard', memberController.memberDashboard);
router.get('/add-expense', memberController.addExpense);
router.get('/manage-expense', memberController.manageExpense);
router.get('/chapter-dashboard/:id', memberController.chapterDashboard);
router.get('/member-dashboard/:id', memberController.memberDashboard);
module.exports = router;
