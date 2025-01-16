const express = require('express');
const router = express.Router();
const memberAccoladesController = require('../../controllers/c-member-accolades/memberAccoladesController');

// Chapter routes
router.get('/manage-memberAccolades', memberAccoladesController.manageMemberAccolades);
router.get('/request-memberAccolades', memberAccoladesController.requestMemberAccolades);


module.exports = router;
