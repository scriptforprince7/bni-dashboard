const express = require('express');
const router = express.Router();

// Route for all refunds page
router.get('/all-refunds', (req, res) => {
    res.render('m-refund/all-refunds');
});

// Route for initiate refund page
router.get('/initiate-refund', (req, res) => {
    res.render('m-refund/initiate-refund');
});

module.exports = router;
