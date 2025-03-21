exports.manageKitty = (req, res) => {
    res.render('m-kitty-dashboard/kitty-dashboard', { title: 'Manage Kitty' });
};

exports.kittyManagement = (req, res) => {
    res.render('m-kitty-dashboard/manage-kitty', { title: 'Kitty Management' });
};

exports.creditManagement = (req, res) => {
    res.render('m-kitty-dashboard/roCredit-management', { title: 'Credit Management' });
};

exports.giveCredit = (req, res) => {
    res.render('m-kitty-dashboard/roGive-credit', { title: 'Give Credit' });
};      

exports.memberWriteOff = (req, res) => {
    res.render('m-kitty-dashboard/roMember-write-off', { title: 'Member Write Off' });
};

exports.memberWiseKitty = (req, res) => {
    res.render('m-kitty-dashboard/roMember-wise-kitty', { title: 'Member Wise Kitty' });
};
