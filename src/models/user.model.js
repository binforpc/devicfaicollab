// src/models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true },
    authMethod: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    domains: [String],
    skills: [String],
    profilePic: String,
    bio: String,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);