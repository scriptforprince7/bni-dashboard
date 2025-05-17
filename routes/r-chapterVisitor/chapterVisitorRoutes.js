const express = require('express');
const router = express.Router();
const chapterVisitorController = require('../../controllers/c-chapterVisitor/chapterVisitorController');
// Region routes
router.get('/addChapterVisitor', chapterVisitorController.addChapterVisitor);

module.exports = router;
