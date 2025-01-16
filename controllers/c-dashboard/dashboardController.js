exports.roDashboard = (req, res) => {
    res.render('ro-dashboard/index', { title: 'RO' });
};

exports.chapterDashboard = (req, res) => {
    res.render('chapter-dashboard/chapter-dashboard', { title: 'Chapter' });
};

exports.memberDashboard = (req, res) => {
    res.render('member-dashboard/member-dashboard', { title: 'Member' });
};
