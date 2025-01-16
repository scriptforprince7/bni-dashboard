const express = require('express');
const router = express.Router();
const authController = require('../../controllers/c-authentication/authController');

// Chapter routes
router.get('/otp-verification', authController.otpVerification);


module.exports = router;