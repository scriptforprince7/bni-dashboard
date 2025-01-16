exports.myProfile = (req, res) => {
    res.render('m-settings/my-profile', { title: 'My Profile' });
};

exports.settings = (req, res) => {
    res.render('m-settings/settings', { title: 'Settings' });
};
exports.userSettings = (req, res) => {
    res.render('m-settings/userSettings', { title: 'userSettings' });
};

