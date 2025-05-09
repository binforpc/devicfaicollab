// config/cloudinary.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // e.g., 'my-cloud-name'
  api_key: process.env.CLOUDINARY_API_KEY, // your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // your Cloudinary API secret
});

module.exports = cloudinary;