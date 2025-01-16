exports.manageKitty = (req, res) => {
    res.render('m-kitty-dashboard/kitty-dashboard', { title: 'Manage Kitty' });
};

exports.kittyManagement = (req, res) => {
    res.render('m-kitty-dashboard/manage-kitty', { title: 'Kitty Management' });
};


