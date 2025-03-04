exports.viewEinvoice = (req, res) => {
    res.render('m-einvoice/view-einvoice', { title: 'Einvoice' });
};

exports.viewCancelledIRNs = (req, res) => {
    res.render('m-einvoice/view-cancelledeinvoice', { title: 'Cancelled IRNs' });
};
