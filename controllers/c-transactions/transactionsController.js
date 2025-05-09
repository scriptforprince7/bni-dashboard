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

exports.interview = (req, res) => {
    res.render('m-visitor/interview', { title: 'Interview' });
}; 

exports.commitment = (req, res) => {
    res.render('m-visitor/commitment', { title: 'Commitment' });
};

exports.inclusion = (req, res) => {
    res.render('m-visitor/inclusion', { title: 'Inclusion' });
};

exports.eoiForm = (req, res) => {
    res.render('m-visitor/eoi-form', { title: 'EOI Form' });
};

exports.newmemberReceipt = (req, res) => {
    res.render('m-visitor/newmemberReceipt', { title: 'New Member Receipt' });
};

exports.visitorForm = (req, res) => {
    res.render('m-visitor/visitorForm', { title: 'Visitor Form' });
};
exports.MemberApplication = (req, res) => {
    res.render('m-visitor/memberApplication', { title: 'Member Application Form' });
};
exports.chapterVisitors = (req, res) => {
    res.render('m-visitor/chapter-visitors', { title: 'Chapter Visitors' });
};

exports.manageUpcomingMembers = (req, res) => {
    res.render('m-visitor/manage-upcoming-members', { title: 'Manage Upcoming Members' });
};




