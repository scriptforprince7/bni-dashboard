const express = require('express');
const router = express.Router();
const chapterTransactionController = require('../../controllers/c-chapterTransaction/chapterTransactionController');

// Region routes
router.get('/manage-transactions', chapterTransactionController.chapterTransactions);
router.get('/generate-invoice', chapterTransactionController.generateInvoice);
router.get('/chapter-generate-invoice', chapterTransactionController.chapterGenerateInvoice);
router.get('/chapter-new-member-payment', chapterTransactionController.newMemberPayment);
router.get('/chapter-multiple-visitor-payment' , chapterTransactionController.chapterMultipleVisitorPayment)




module.exports = router;
