const express = require('express');
const router = express.Router();
const indexController = require('../../controllers/c-home/indexController');

// Route for the index page
router.get('/', indexController.homePage);

module.exports = router;
