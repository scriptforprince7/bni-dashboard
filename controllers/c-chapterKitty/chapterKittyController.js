exports.manageChapterKitty = (req, res) => {
    res.render('m-chapterKitty/manage-chapterKitty', { title: 'Manage Chapter Kitty' });
};

exports.chapterRaiseBill = (req, res) => {
    res.render('m-chapterKitty/chapter-raiseBill', { title: 'Chapter Raise a New Bill' });
};


