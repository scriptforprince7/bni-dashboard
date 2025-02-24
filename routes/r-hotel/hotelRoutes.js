const express = require('express');
const router = express.Router();
const hotelController = require('../../controllers/c-hotels/hotelController');

// Region routes
router.get('/manage-hotels', hotelController.viewHotels);
router.get('/add-hotel', hotelController.addHotel);
router.get('/edit-hotel/:hotel_id', hotelController.editHotel);
router.get('/view-hotel/:hotel_id',hotelController.viewHotel);

module.exports = router;
