const express = require('express');
const router = express.Router();
const trainingController = require('../../controllers/c-memberTraining/memberTrainingController');

// Member routes
router.get('/all-trainings', trainingController.allTrainings);
router.get('/my-training', trainingController.myTraining);

module.exports = router;
