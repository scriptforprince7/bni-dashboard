exports.viewMemberInvoice = (req, res) => {
    res.render('m-memberInvoice/view-memberInvoice', { title: 'View Member Invoice' });
};


exports.viewChapterInvoice = (req, res) => {
    res.render('m-memberInvoice/view-chapterInvoice', { title: 'View Chapter Invoice' });
}