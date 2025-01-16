const express = require('express');
const router = express.Router();
const eInvoiceController = require('../../controllers/c-eInvoice/eInvoiceContoller');

// Chapter routes
router.get('/einvoice', eInvoiceController.viewEinvoice);

module.exports = router;
