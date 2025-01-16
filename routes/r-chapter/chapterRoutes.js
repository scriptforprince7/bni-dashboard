const express = require('express');
const router = express.Router();
const chapterController = require('../../controllers/c-chapter/chapterController');

// Chapter routes
router.get('/manage-chapter', chapterController.manageChapter);
router.get('/add-chapter', chapterController.addChapter);
router.get('/edit-chapter', chapterController.editChapter);
router.get('/view-chapter', chapterController.viewChapter);

module.exports = router;
