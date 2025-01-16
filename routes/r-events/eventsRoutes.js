const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/c-events/eventsControllers');

// Events routes
router.get('/manage-events', eventController.manageEvents);
router.get('/add-event', eventController.addEvent);
router.get('/edit-event', eventController.editEvent);

module.exports = router;
