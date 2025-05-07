const express = require('express');
const router = express.Router();
const chapterKitty = require('../../controllers/c-chapterKitty/chapterKittyController');

// Chapter kitty routes
router.get('/manage-chapterKitty', chapterKitty.manageChapterKitty);
router.get('/chapter-raiseBill', chapterKitty.chapterRaiseBill);
router.get('/chapter-kittyInvoice', chapterKitty.chapterKittyInvoice);
router.get('/chapter-giveCredit', chapterKitty.chapterGiveCredit);
router.get('/chapter-creditManagement', chapterKitty.chapterCreditManagement);
router.get('/chapter-memberRightOff', chapterKitty.chapterMemberRightOff);
router.get('/chapter-memberWiseKitty', chapterKitty.chapterMemberWiseKitty);
router.get('/chapter-memberRightOffManagement', chapterKitty.memberRightOffManagement);
router.get('/chapter-wiseLedger', chapterKitty.chapterWiseLedger);
router.get('/chapter-addPayment', chapterKitty.chapterAddPayment);

module.exports = router;
