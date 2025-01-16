const express = require('express');
const router = express.Router();
const transactionsController = require('../../controllers/c-transactions/transactionsController');

// Region routes
router.get('/manage-transactions', transactionsController.manageTransactions);
router.get('/all-transactions', transactionsController.allTransactions);
router.get('/new-invoice', transactionsController.addInvoice);
router.get('/view-invoice', transactionsController.viewInvoice);
router.get('/generate-invoice', transactionsController.generateInvoice);


module.exports = router;
