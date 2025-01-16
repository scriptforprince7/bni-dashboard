exports.manageClassifications = (req, res) => {
    res.render('m-classifications/manage-classifications', { title: 'Manage Classifications' });
};

exports.addClassification = (req, res) => {
    res.render('m-classifications/add-classification', { title: 'Add Classification' });
};

exports.editClassification = (req, res) => {
    res.render('m-classifications/edit-classification', { title: 'Edit Classification' });
};
