exports.manageChapterMember = (req, res) => {
    res.render('m-chapter-member/manage-chapter-member', { title: 'ChapterMember' });
};

exports.addChapterMember = (req, res) => {
    res.render('m-chapter-member/add-chapter-member', { title: 'addChapterMember' });
};

exports.editChapterMember = (req, res) => {
    res.render('m-chapter-member/edit-chapter-member', { title: 'editChapterMember' });
};

exports.viewChapterMember = (req, res) => {
    res.render('m-chapter-member/view-chapter-member', { title: 'ViewChapterMember' });
};