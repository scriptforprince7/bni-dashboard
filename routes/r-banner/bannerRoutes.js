// routes/r-banner/bannerRoutes.js

const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/c-banner/bannerController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // temp; backend_data will handle final storage

// Routes for banners
router.get('/manage-banners', bannerController.manageBanners);
router.get('/add-banner', bannerController.addBanner);
router.get('/edit-banner', bannerController.editBanner);

router.post(
  '/add-banner',
  upload.single('banner_image'),
  bannerController.addBannerSubmit
);

// router.post(
//   '/add-banner',
//   upload.fields([{ name: 'banner_image', maxCount: 1 }]),
//   bannerController.addBannerSubmit
// );

router.put('/edit-banner/:id', upload.single('banner_image') ,bannerController.editBannerSubmit);
router.get("/delete-banner/:id", bannerController.deleteBanner);
module.exports = router;

