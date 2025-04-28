const express = require('express');
const router = express.Router();
const expenseController = require('../../controllers/c-expense/expensesController');

// Events routes
router.get('/manage-expenses', expenseController.manageExpenses);
router.get('/add-expenses', expenseController.addExpense);
router.get('/edit-expense/', expenseController.editExpense)
router.get('/manage-expense-types', expenseController.manageExpenseTypes)
router.get('/add-expense-type/', expenseController.addExpenseType);
router.get('/manage-vendors', expenseController.manageVendors);
module.exports = router;