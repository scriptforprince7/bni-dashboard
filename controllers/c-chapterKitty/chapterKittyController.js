exports.manageChapterKitty = (req, res) => {
    res.render('m-chapterKitty/manage-chapterKitty', { title: 'Manage Chapter Kitty' });
};

exports.chapterRaiseBill = (req, res) => {
    res.render('m-chapterKitty/chapter-raiseBill', { title: 'Chapter Raise a New Bill' });
};

exports.chapterKittyInvoice = (req, res) => {
    res.render('m-chapterKitty/chapter-kittyInvoice', { title: 'Chapter Kitty Invoice' });
};

exports.chapterGiveCredit = (req, res) => {
    res.render('m-chapterKitty/chapter-giveCredit', { title: 'Chapter Kitty Invoice' });
};

exports.chapterCreditManagement = (req, res) => {
    res.render('m-chapterKitty/chapter-creditManagement', { title: 'Chapter Kitty Invoice' });
};

