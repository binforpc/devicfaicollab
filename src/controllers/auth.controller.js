// src/controllers/auth.controller.js
require('dotenv').config();
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');

// generate JWT helper
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });

// --- Local login ---
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
    }
    // Flow 1: Google‑only users cannot do email/password
    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        message: 'You signed up with Google OAuth; please log in with Google.'
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    res.json({ success: true, message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0)
  });
  res.setHeader('Cache-Control', 'no-cache');
  res.json({ success: true, message: 'Logged out successfully' });
};

// --- Google callback with all flows handled ---
exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    // Flow 4 or other strategy error
    if (err) {
      return res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    if (!user) {
      const msg = (info && info.message) || 'Google authentication failed';
      return res.redirect(`/login?error=${encodeURIComponent(msg)}`);
    }
    // Success → set JWT
    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    if (info && info.newUser) {
      // Flow 1 & 3: must complete profile
      return res.redirect('/signup?google=true');
    }
    // Flow 2: returning Google user
    return res.redirect('/me');
  })(req, res, next);
};