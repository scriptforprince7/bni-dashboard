// controllers/c-banner/bannerController.js

const bannerApi = require('../../utils/api/bannerApi');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require("axios");


exports.manageBanners = async (req, res) => {
  try {
    const response = await bannerApi.getAllBanners();
    const banners = response.data;
    res.render('m-banner/manage-banner', {
      title: 'Manage Banners',
      banners: banners.data
    });
    // console.log("Fetched banners:", banners);
  } catch (error) {
    console.error('Error fetching banners:', error.message);
    res.status(500).send('Failed to fetch banners');
  }
};


exports.addBannerSubmit = async (req, res) => {
  const formData = new FormData();

  formData.append("banner_heading", req.body.banner_heading);
  formData.append("banner_description", req.body.banner_description);

  formData.append("banner_button_0_text", req.body.banner_button_0_text);
  formData.append("banner_button_0_link", req.body.banner_button_0_link);
  formData.append("banner_button_0_x_position", req.body.banner_button_0_x_position);
  formData.append("banner_button_0_y_position", req.body.banner_button_0_y_position); // NEW
  formData.append("banner_button_0_status", req.body.banner_button_0_status ? "true" : "false");

  formData.append("banner_button_1_text", req.body.banner_button_1_text);
  formData.append("banner_button_1_link", req.body.banner_button_1_link);
  formData.append("banner_button_1_x_position", req.body.banner_button_1_x_position);
  formData.append("banner_button_1_y_position", req.body.banner_button_1_y_position); // NEW
  formData.append("banner_button_1_status", req.body.banner_button_1_status ? "true" : "false");

  formData.append("banner_image", fs.createReadStream(req.file.path), req.file.originalname);

  const response = await axios.post("https://backend.bninewdelhi.com/api/banners", formData, {
    headers: formData.getHeaders()
  });

  res.redirect("/manage-banners");
};

exports.addBanner = (req, res) => {
  res.render('m-banner/add-banner', { title: 'Add Banner' });
};

exports.editBanner = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    const response = await bannerApi.getBannerById(id);
    const banner = response.data?.data;

    if (!banner) throw new Error('Banner not found');

    res.render('m-banner/edit-banner', {
      title: 'Edit Banner',
      banner: banner
    });
  } catch (err) {
    console.error('EditBanner Error:', err.message);
    res.status(500).send('Failed to load banner for editing');
  }
};

exports.editBannerSubmit = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      banner_heading,
      banner_description,
      banner_status,
      banner_button_0_status,
      banner_button_0_text,
      banner_button_0_link,
      banner_button_0_x_position,
      banner_button_0_y_position,
      banner_button_1_status,
      banner_button_1_text,
      banner_button_1_link,
      banner_button_1_x_position,
      banner_button_1_y_position
    } = req.body;

    const form = new FormData();

    form.append("banner_heading", banner_heading);
    form.append("banner_description", banner_description);
    form.append("banner_status", banner_status ?? "false");

    form.append("banner_button_0_status", banner_button_0_status ?? "false");
    form.append("banner_button_0_text", banner_button_0_text);
    form.append("banner_button_0_link", banner_button_0_link);
    form.append("banner_button_0_x_position", banner_button_0_x_position);
    form.append("banner_button_0_y_position", banner_button_0_y_position);

    form.append("banner_button_1_status", banner_button_1_status ?? "false");
    form.append("banner_button_1_text", banner_button_1_text);
    form.append("banner_button_1_link", banner_button_1_link);
    form.append("banner_button_1_x_position", banner_button_1_x_position);
    form.append("banner_button_1_y_position", banner_button_1_y_position);

    if (req.file) {
      const imagePath = path.join(__dirname, "../../", req.file.path);
      form.append("banner_image", fs.createReadStream(imagePath), req.file.originalname);
    }

    const response = await axios({
      method: 'put',
      url: `https://backend.bninewdelhi.com/api/banners/${id}`,
      data: form,
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return res.redirect("/manage-banners");

  } catch (err) {
    console.error("Edit banner submit error:", err.message);
    req.body.id = req.params.id;
    return res.render("m-banner/edit-banner", {
      error: "Failed to update banner",
      banner: req.body,
    });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    await axios.delete(`https://backend.bninewdelhi.com/api/banners/${id}`);

    res.redirect("/manage-banners");
  } catch (err) {
    console.error("Delete banner error:", err.message);
    res.status(500).send("Failed to delete banner");
  }
};