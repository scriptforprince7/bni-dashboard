const express = require('express');
const router = express.Router();
const transactionsController = require('../../controllers/c-transactions/transactionsController');

// Region routes
router.get('/manage-transactions', transactionsController.manageTransactions);
router.get('/all-transactions', transactionsController.allTransactions);
router.get('/new-invoice', transactionsController.addInvoice);
router.get('/view-invoice', transactionsController.viewInvoice);
router.get('/generate-invoice', transactionsController.generateInvoice);
router.get('/new-member-payment', transactionsController.newMemberPayment);
router.get('/cancelled-irns', transactionsController.cancelledIRNs);
router.get('/manage-visitors', transactionsController.manageVisitors);
router.get('/interview', transactionsController.interview);
router.get('/commitment', transactionsController.commitment);
router.get('/inclusion', transactionsController.inclusion); 
router.get('/eoi-form', transactionsController.eoiForm);


module.exports = router;
