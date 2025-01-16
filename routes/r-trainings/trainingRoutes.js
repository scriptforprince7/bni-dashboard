const express = require('express');
const router = express.Router();
const trainingController = require('../../controllers/c-trainings/trainingController');

// Member routes
router.get('/manage-trainings', trainingController.manageTrainings);
router.get('/add-training', trainingController.addTraining);
router.get('/edit-training', trainingController.editTraining);
router.get('/view-training', trainingController.viewTraining);

module.exports = router;
