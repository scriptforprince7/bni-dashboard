const express = require('express');
const router = express.Router();
const linksController = require('../../controllers/c-links/linksController');

// Events routes
router.get('/show-all-links', linksController.showAllLinks);


module.exports = router;
