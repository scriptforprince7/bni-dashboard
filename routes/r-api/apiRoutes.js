// routes/r-api/apiRoutes.js
const express = require('express');
const router = express.Router();

// Endpoint to get the regions API URL
router.get('/regions-api', (req, res) => {
    res.json({ apiUrl: process.env.REGIONS_API }); // Send the API URL from .env
});

// Endpoint to get the chapters API URL
router.get('/chapters-api', (req, res) => {
    res.json({ apiUrl: process.env.CHAPTERS_API });
});

// Endpoint to get the members API URL
router.get('/members-api', (req, res) => {
    res.json({ apiUrl: process.env.MEMBERS_API });
});

// Endpoint to get the accolades API URL
router.get('/accolades-api', (req, res) => {
    res.json({ apiUrl: process.env.ACCOLADES_API });
});

// Endpoint to get the member category API URL
router.get('/member-category-api', (req, res) => {
    res.json({ apiUrl: process.env.MEMBER_CATEGORY_API });
});

// Endpoint to get the membership fee API URL
router.get('/membership-fee-api', (req, res) => {
    res.json({ apiUrl: process.env.MEMBERSHIP_FEE_API });
});

// Endpoint to get the membership fee API URL
router.get('/universal-link-api', (req, res) => {
    res.json({ apiUrl: process.env.UNIVERSAL_LINK_API });
});


module.exports = router;
