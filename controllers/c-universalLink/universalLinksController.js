exports.manageUniversal = (req, res) => {
    res.render('m-universalLinks/manage-universal-links', { title: 'Universal Links' });
};

exports.editUniversalLink = (req, res) => {
    res.render('m-universalLinks/edit-universal-link', { title: 'Edit Universal Link' });
};