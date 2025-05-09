// src/routes/auth.routes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  login,
  logout,
  googleAuthCallback
} = require('../controllers/auth.controller');
const { checkAuthForPublic } = require('../middlewares/auth.middleware');

// Local
router.post('/login', login);
router.post('/logout', logout);
router.get('/status', checkAuthForPublic);

// Google OAuth start
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth finish — our custom handler
router.get('/google/callback', googleAuthCallback);

module.exports = router;