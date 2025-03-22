const express = require('express');
const router = express.Router();
const accoladesChapterController = require('../../controllers/c-accoladesChapter/accoladesChapterController');

// Chapter routes
router.get('/manage-accolade', accoladesChapterController.manageAccolades);
router.get('/add-accolade', accoladesChapterController.addAccolades);
router.get('/edit-accolade', accoladesChapterController.editAccolades);
router.get('/request-chapter-accolade', accoladesChapterController.requestChapterAccolades);
router.get('/requested-chapter-requisition', accoladesChapterController.requestChapterRequisition);
router.get('/member-wise-accolades', accoladesChapterController.memberWiseAccolades);


module.exports = router;
