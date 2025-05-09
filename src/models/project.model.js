// project.model.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  domain: { type: String, required: true },
  // Optional main file URL (if needed)
  fileUrl: { type: String },
  // New field for preview image URL
  previewUrl: { type: String },
  // Array for additional photo uploads
  photoUrls: { type: [String], default: [] },
  projectLinks: { type: [String], default: [] },
  teamMembers: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);