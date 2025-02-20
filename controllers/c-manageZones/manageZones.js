exports.viewZones = (req, res) => {
    res.render('m-manageZones/view-zones', { title: 'View Zones' });
};

exports.addZone = (req, res) => {
    res.render('m-manageZones/add-zone', { title: 'Add Zone' });
};

exports.editZone = (req, res) => {
    res.render('m-manageZones/edit-zone', { title: 'Edit Zone' });
};
