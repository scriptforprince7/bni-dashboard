const express = require('express');
const router = express.Router();
const chapterMemberController = require('../../controllers/c-chapter/chapterMemberController');

// Chapter Member routes
router.get('/managechaptermember', chapterMemberController.manageChapterMember);
router.get('/addchaptermember', chapterMemberController.addChapterMember);
router.get('/editchaptermember', chapterMemberController.editChapterMember);
router.get('/viewchaptermember', chapterMemberController.viewChapterMember);

module.exports = router;
