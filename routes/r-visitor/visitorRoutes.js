const express = require('express');
const router = express.Router();
const visitorController = require('../../controllers/c-visitor/visitorController');
// Region routes
router.get('/add-visitor', visitorController.addVisitor);

module.exports = router;
