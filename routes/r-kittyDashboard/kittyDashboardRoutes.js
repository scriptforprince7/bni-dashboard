const express = require('express');
const router = express.Router();
const kittyController = require('../../controllers/c-kittyDashboard/kittyDashboardController');

// Events routes
router.get('/manage-kitty', kittyController.manageKitty);
router.get('/kitty-management', kittyController.kittyManagement);
router.get('/credit-management', kittyController.creditManagement);
router.get('/give-credit', kittyController.giveCredit);
router.get('/member-write-off', kittyController.memberWriteOff);
router.get('/member-wise-kitty', kittyController.memberWiseKitty);

module.exports = router;
