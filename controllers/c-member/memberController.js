exports.manageMembers = (req, res) => {
    res.render('m-member/manage-members', { title: 'Member' });
};

exports.addMember = (req, res) => {
    res.render('m-member/add-member', { title: 'addMember' });
};

exports.editMember = (req, res) => {
    res.render('m-member/edit-members', { title: 'editMember' });
};

exports.viewMember = (req, res) => {
    res.render('m-member/view-members', { title: 'viewMember' });
};

exports.memberTransactions = (req, res) => {
    res.render('m-member/member-transactions', { title: 'Member Transactions' });
};

exports.memberAllTransactions = (req, res) => {
    res.render('m-member/member-Alltransactions', { title: 'Member All Transactions' });
};