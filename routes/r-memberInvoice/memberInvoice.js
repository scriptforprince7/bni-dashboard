const express = require('express');
const router = express.Router();
const transactionsController = require('../../controllers/c-memberInvoice/memberInvoiceController');

router.get('/view-memberInvoice', transactionsController.viewMemberInvoice);
router.get('/view-chapterInvoice', transactionsController.viewChapterInvoice);


module.exports = router;
