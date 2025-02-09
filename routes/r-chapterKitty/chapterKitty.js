const express = require('express');
const router = express.Router();
const chapterKitty = require('../../controllers/c-chapterKitty/chapterKittyController');

// Chapter kitty routes
router.get('/manage-chapterKitty', chapterKitty.manageChapterKitty);
router.get('/chapter-raiseBill', chapterKitty.chapterRaiseBill);
router.get('/chapter-kittyInvoice', chapterKitty.chapterKittyInvoice);
router.get('/chapter-giveCredit', chapterKitty.chapterGiveCredit);

module.exports = router;
