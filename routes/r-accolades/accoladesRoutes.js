const express = require('express');
const router = express.Router();
const accoladesController = require('../../controllers/c-accolades/accoladesController');

// Chapter routes
router.get('/manage-accolades', accoladesController.manageAccolades);
router.get('/add-accolades', accoladesController.addAccolades);
router.get('/edit-accolades', accoladesController.editAccolades);

module.exports = router;
