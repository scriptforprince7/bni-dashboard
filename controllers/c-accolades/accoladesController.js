exports.manageAccolades = (req, res) => {
    res.render('m-accolade/manage-accolades', { title: 'Manage Accolades' });
};

exports.addAccolades = (req, res) => {
    res.render('m-accolade/add-accolades', { title: 'Add Accolades' });
};

exports.editAccolades = (req, res) => {
    res.render('m-accolade/edit-accolades', { title: 'Edit Accolades' });
};

