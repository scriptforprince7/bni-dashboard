exports.manageChapter = (req, res) => {
    res.render('m-chapter/manage-chapter', { title: 'Chapter' });
};

exports.addChapter = (req, res) => {
    res.render('m-chapter/add-chapter', { title: 'addChapter' });
};

exports.editChapter = (req, res) => {
    res.render('m-chapter/edit-chapter', { title: 'editChapter' });
};

exports.viewChapter = (req, res) => {
    res.render('m-chapter/view-chapter', { title: 'ViewChapter' });
};

