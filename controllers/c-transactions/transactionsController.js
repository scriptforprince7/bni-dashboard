exports.manageTransactions = (req, res) => {
    res.render('m-transactions/manage-transactions', { title: 'Transactions' });
};

exports.addInvoice = (req, res) => {
    res.render('m-invoice/generate-invoice', { title: 'Invoice' });
};

exports.allTransactions = (req, res) => {
    res.render('m-transactions/all-transactions', { title: 'All Transactions' });
};

exports.viewInvoice = (req, res) => {
    res.render('m-transactions/view-transaction', { title: 'View Transactions' });
};

exports.generateInvoice = (req, res) => {
    res.render('m-transactions/generate-invoice', { title: 'Generate Invoice' });
};

exports.settledTransactions = (req, res) => {
    res.render('m-transactions/settled-transactions', { title: 'Settled Transactions' });
};

exports.newMemberPayment = (req, res) => {
    res.render('m-transactions/new-member-payment', { title: 'New Member Payment' });
};

exports.cancelledIRNs = (req, res) => {
    res.render('m-transactions/cancelled-irns', { title: 'Cancelled IRNs' });
};

exports.manageVisitors = (req, res) => {
    res.render('m-visitor/manage-visitors', { title: 'Manage Visitors' });
};