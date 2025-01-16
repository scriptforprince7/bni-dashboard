const express = require('express');
const router = express.Router();
const transactionsController = require('../../controllers/c-memberInvoice/memberInvoiceController');

router.get('/view-memberInvoice', transactionsController.viewMemberInvoice);


module.exports = router;
