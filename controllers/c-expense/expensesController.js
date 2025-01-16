exports.manageExpenses = (req, res) => {
    res.render('m-expense/manage-expense', { title: 'Manage Expenses' });
};

exports.addExpense = (req, res) => {
    res.render('m-expense/add-expense', { title: 'Add Expense' });
};
exports.editExpense = (req, res) => {
    res.render('m-expense/edit-expense', { title: 'Edit Expense' });
};
exports.manageExpenseTypes = (req, res) => {
    res.render('m-expense/manage-expense-types', { title: 'Manage Expense Types' });
};
exports.addExpenseType = (req, res) => {
    res.render('m-expense/add-expense-type', { title: 'Add Expense Type' });
};




