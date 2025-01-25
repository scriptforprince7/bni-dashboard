const sendNotification = (req, res) => {
    res.render('m-sendNotification/sendNotification', { title: 'SendNotification' });
};

module.exports = { sendNotification };