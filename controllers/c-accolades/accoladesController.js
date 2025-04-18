exports.manageAccolades = (req, res) => {
    res.render('m-accolade/manage-accolades', { title: 'Manage Accolades' });
};

exports.addAccolades = (req, res) => {
    res.render('m-accolade/add-accolades', { title: 'Add Accolades' });
};

exports.editAccolades = (req, res) => {
    res.render('m-accolade/edit-accolades', { title: 'Edit Accolades' });
};

exports.requestedRequisitions = (req, res) => {
    res.render('m-accolade/requested-requisitions', { title: 'Requested Requisitions' });
};

exports.memberWiseRequisitions = (req, res) => {
    res.render('m-accolade/member-wise-requisitions', { title: 'Member Wise Requisitions' });
};
