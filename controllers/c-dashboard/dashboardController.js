exports.roDashboard = (req, res) => {
    res.render('ro-dashboard/index', { title: 'RO' });
};

exports.chapterDashboard = (req, res) => {
    res.render('chapter-dashboard/chapter-dashboard', { title: 'Chapter' });
};

exports.memberDashboard = (req, res) => {
    res.render('member-dashboard/member-dashboard', { title: 'Member' });
};

exports.addExpense = (req, res) => {
    res.render('ro-dashboard/add-expense', { title: 'Add Expense' });
};

exports.manageExpense = (req, res) => {
    res.render('ro-dashboard/manage-expense', { title: 'Manage Expense' });
};