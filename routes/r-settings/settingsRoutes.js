const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/c-settings/settingsController');

// Region routes
router.get('/my-profile', settingsController.myProfile);
router.get('/member-settings', settingsController.settings);
router.get('/settings', settingsController.userSettings);


module.exports = router;
