const express = require('express');
const router = express.Router();
const chapterEoiController = require('../../controllers/c-chapterEoi/chapterEoiController');

// Region routes
router.get('/manage-eoiForms', chapterEoiController.chapterEoi);




module.exports = router;
