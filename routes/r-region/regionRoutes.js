const express = require('express');
const router = express.Router();
const regionController = require('../../controllers/c-region/regionController');

// Region routes
router.get('/manage-region', regionController.manageRegion);
router.get('/add-region', regionController.addRegion);
router.get('/edit-region', regionController.editRegion);
router.get('/view-region',regionController.viewRegion)

module.exports = router;
