const express = require('express');
const router = express.Router();
const roVisitorController = require('../../controllers/c-roVisitor/roVisitorController');
// Region routes
router.get('/addRoVisitor', roVisitorController.addRoVisitor);

module.exports = router;
