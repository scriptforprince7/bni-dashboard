exports.viewHotels = (req, res) => {
    res.render('m-hotels/view-hotels', { title: 'View Hotels' });
};

exports.addHotel = (req, res) => {
    res.render('m-hotels/add-hotel', { title: 'Add Hotel' });
};

exports.editHotel = (req, res) => {
    res.render('m-hotels/edit-hotel', { title: 'Edit Hotel' });
};
exports.viewHotel = (req, res) => {
    res.render('m-hotels/view-hotel', { title: 'View Hotel' });
};

