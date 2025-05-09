// src/models/ad.model.js
const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
}, { _id: false });

const AdSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    domain: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    // New Field: Optional project/work deadline.
    deadline: { type: Date },
    // New Field: Project status with a set of allowed values.
    status: { 
      type: String, 
      enum: ['Planning', 'In Progress', 'Completed', 'On Hold'], 
      default: 'Planning',
      required: true 
    },
    // New Field: Required skills (optional).
    skills: { type: String },
    joinRequests: { type: [JoinRequestSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', AdSchema);