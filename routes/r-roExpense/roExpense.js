const express = require('express');
const router = express.Router();
const roExpenseController = require('../../controllers/c-roExpense/roExpense');

// Region routes
router.get('/view-expenses', roExpenseController.viewExpense);
router.get('/add-expense', roExpenseController.addExpense);
router.get('/all-vendors', roExpenseController.allVendors);
router.get('/edit-expense', roExpenseController.editExpense);

module.exports = router;
