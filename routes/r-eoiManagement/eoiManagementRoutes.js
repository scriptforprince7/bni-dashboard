const express = require('express');
const router = express.Router();
const eoiManagementController = require('../../controllers/c-eoiManagement/eoiManagementController');

// Region routes
router.get('/manage-eoiForms', eoiManagementController.eoiManagement);




module.exports = router;
