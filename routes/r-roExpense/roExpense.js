const express = require('express');
const router = express.Router();
const roExpenseController = require('../../controllers/c-roExpense/roExpense');

// Region routes
router.get('/view-expenses', roExpenseController.viewExpense);
router.get('/add-expense', roExpenseController.addExpense);

module.exports = router;
