exports.manageAccolades = (req, res) => {
    res.render('m-accoladeChapter/manage-accolades', { title: 'Manage Accolades' });
};

exports.addAccolades = (req, res) => {
    res.render('m-accoladeChapter/add-accolades', { title: 'Add Accolades' });
};

exports.editAccolades = (req, res) => {
    res.render('m-accoladeChapter/edit-accolades', { title: 'Edit Accolades' });
};

exports.requestChapterAccolades = (req, res) => {
    res.render('m-accoladeChapter/request-chapter-accolades', { title: 'Request Chapter Accolades' });
};

exports.requestChapterRequisition = (req, res) => {
    res.render('m-accoladeChapter/request-chapter-requisition', { title: 'Request Chapter Requisition' });
};

exports.memberWiseAccolades = (req, res) => {
    res.render('m-accoladeChapter/member-wise-accolade', { title: 'Member Wise Accolade' });
};

