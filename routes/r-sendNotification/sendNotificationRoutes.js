const express = require('express');
const router = express.Router();
const sendNotificationController = require('../../controllers/c-sendNotification/sendNotificationController');

router.get('/sendNotification', sendNotificationController.sendNotification);

module.exports = router;