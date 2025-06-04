exports.chapterTransactions = (req, res) => {
    res.render('m-transactions/chapter-transactions', { title: 'Chapter Transactions' });
};

exports.generateInvoice = (req, res) => {
    res.render('m-transactions/chapter-generate-invoice', { title: 'Generate Invoice' });
};

exports.chapterGenerateInvoice = (req, res) => {
    res.render('m-transactions/chapterGenerateInvoice', { title: 'Chapter Generate Invoice' });
};

exports.newMemberPayment = (req, res) => {
    res.render('m-transactions/chapter-new-member-payment', { title: 'New Member Payment' });
};

exports.chapterMultipleVisitorPayment = (req, res) => {
    res.render('m-transactions/chapter-multiple-visitor-payment', { title: 'Chapter multiple visitor Payment' });
};

