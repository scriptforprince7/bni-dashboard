const express = require('express');
const router = express.Router();
const chapterTransactionController = require('../../controllers/c-chapterTransaction/chapterTransactionController');

// Region routes
router.get('/manage-transactions', chapterTransactionController.chapterTransactions);




module.exports = router;
