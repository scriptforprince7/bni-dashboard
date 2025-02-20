const express = require('express');
const router = express.Router();
const manageZonesController = require('../../controllers/c-manageZones/manageZones');

// Region routes
router.get('/view-zones', manageZonesController.viewZones);
router.get('/add-zone', manageZonesController.addZone);
router.get('/edit-zone/:id', manageZonesController.editZone);

module.exports = router;
