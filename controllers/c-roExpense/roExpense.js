exports.viewExpense = (req, res) => {
    res.render('m-roExpense/view-expenses', { title: 'View Expenses' });
};

exports.addExpense = (req, res) => {
    res.render('m-roExpense/add-expense', { title: 'Add Expenses' });
};
