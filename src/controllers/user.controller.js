// user.controller.js
const User = require("../models/user.model");
const cloudinary = require("../config/cloudinary");

// Get all users (excluding sensitive fields)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select({ _id: 0, password: 0 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Check email availability / ownership
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ available: false, message: "Email is required" });
    }
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });
    if (!user) {
      return res.json({ available: true });
    }
    // If they signed up via Google
    if (user.authMethod === "google") {
      return res.json({
        available: false,
        message:
          "You are already registered with Google OAuth; please log in with Google.",
      });
    }
    // Otherwise it’s a local account
    return res.json({
      available: false,
      message: "Email is already registered; please log in.",
    });
  } catch (err) {
    res
      .status(500)
      .json({ available: false, message: "Server error: " + err.message });
  }
};

// User signup
exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, domains, skills, bio } = req.body;

    // Flow 3: existing Google user?
    const existingEmailUser = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingEmailUser) {
      if (existingEmailUser.authMethod === "google") {
        return res.status(400).json({
          success: false,
          error:
            "You are already registered with Google OAuth; please log in with Google.",
        });
      }
      return res
        .status(400)
        .json({ success: false, error: "Email is already in use." });
    }

    if (!username) {
      return res
        .status(400)
        .json({ success: false, error: "Username is required." });
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: "Username is already taken." });
    }

    const domainsArray = Array.isArray(domains)
      ? domains
      : domains?.split(",").map((d) => d.trim()) || [];
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills?.split(",").map((s) => s.trim()) || [];

    let profilePicUrl = "";
    if (req.file) {
      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "user_profiles" },
            (error, result) => (result ? resolve(result) : reject(error))
          );
          stream.end(buffer);
        });
      const uploadResult = await streamUpload(req.file.buffer);
      profilePicUrl = uploadResult.secure_url;
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      authMethod: "local",
      domains: domainsArray,
      skills: skillsArray,
      bio,
      profilePic: profilePicUrl,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Check if username is available
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ available: false, error: "Username is required" });
    }
    const user = await User.findOne({ username: username.toLowerCase() });
    return res.json({ available: !user });
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
};

// Get current user details
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get user by username (for public profiles)
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() }).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update user details including profile picture
exports.updateUser = async (req, res) => {
  try {
    const updateFields = {
      name: req.body.name,
      username: req.body.username?.toLowerCase(),
      email: req.body.email,
      bio: req.body.bio,
      domains: req.body.domains
        ? req.body.domains.split(",").map(d => d.trim())
        : [],
      skills: req.body.skills
        ? req.body.skills.split(",").map(s => s.trim())
        : []
    };

    if (req.file) {
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "user_profiles" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(buffer);
        });
      };
      const uploadResult = await streamUpload(req.file.buffer);
      updateFields.profilePic = uploadResult.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
      runValidators: true
    }).select("-password");

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};