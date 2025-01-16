exports.manageRegion = (req, res) => {
    res.render('m-region/manage-region', { title: 'Region' });
};

exports.addRegion = (req, res) => {
    res.render('m-region/add-region', { title: 'addRegion' });
};

exports.editRegion = (req, res) => {
    res.render('m-region/edit-region', { title: 'editRegion' });
};

exports.viewRegion = (req, res) => {
    res.render('m-region/view-region', { title: 'View Region' });
};