exports.allTrainings = (req, res) => {
    res.render('m-memberTraining/manage-memberTrainings', { title: 'Manage Member Trainings' });
};

exports.myTraining = (req,res) => {
    res.render('m-memberTraining/view-memberTraining', { title: 'View Member Training' })
}
