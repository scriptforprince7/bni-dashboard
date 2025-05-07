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
    res.render('m-chapterKitty/chapter-giveCredit', { title: 'Chapter Give Credit' });
};

exports.chapterCreditManagement = (req, res) => {
    res.render('m-chapterKitty/chapter-creditManagement', { title: 'Chapter Credit Management' });
};

exports.chapterMemberRightOff = (req, res) => {
    res.render('m-chapterKitty/chapter-memberRightOff', { title: 'Chapter Member Right Off' });
};

exports.chapterMemberWiseKitty = (req, res) => {
    res.render('m-chapterKitty/chapter-memberWiseKitty', { title: 'Chapter Member Wise Kitty' });
};

exports.memberRightOffManagement = (req, res) => {
    res.render('m-chapterKitty/chapter-memberRightOffManagement', { title: 'Chapter Member Right Off Management' });
};

exports.chapterWiseLedger = (req, res) => {
    res.render('m-chapterKitty/chapter-wiseLedger', { title: 'Chapter Wise Ledger' });
};

exports.chapterAddPayment = (req, res) => {
    res.render('m-chapterKitty/chapter-addPayment', { title: 'Chapter Add Payment' });
};
