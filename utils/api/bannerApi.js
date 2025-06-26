const axios = require('axios');

const BASE_URL = process.env.BANNER_API_BASE_URL || 'https://backend.bninewdelhi.com/banners'; // adjust as needed

exports.getAllBanners = async () => {
    return await axios.get(`${BASE_URL}`);
};

exports.getBannerById = async (id) => {
    return await axios.get(`${BASE_URL}/${id}`);
};

exports.createBanner = async (data) => {
    return await axios.post(`${BASE_URL}`, data);
};

exports.updateBanner = async (id, data) => {
    return await axios.put(`${BASE_URL}/${id}`, data);
};

exports.deleteBanner = async (id) => {
    return await axios.delete(`${BASE_URL}/${id}`);
};
