exports.homePage = (req, res) => {
    // const baseUrl = process.env.BASE_URl;
    res.render('index', { title: 'Home Page' , baseUrl: process.env.BASE_URl });
};
