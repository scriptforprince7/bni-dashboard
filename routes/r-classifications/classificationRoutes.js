const express = require('express');
const router = express.Router();
const classificationController = require('../../controllers/c-classifications/classificationsController');

// Chapter routes
router.get('/manage-classifications', classificationController.manageClassifications);
router.get('/add-classification', classificationController.addClassification);
router.get('/edit-clasification', classificationController.editClassification);

module.exports = router;
