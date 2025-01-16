exports.manageMemberAccolades = (req, res) => {
    res.render('m-member-accolade/manage-member-accolades', { title: 'Manage Member Accolades' });
};
exports.requestMemberAccolades = (req, res) => {
    res.render('m-member-accolade/request-member-accolades', { title: 'Request Member Accolades' });
};

