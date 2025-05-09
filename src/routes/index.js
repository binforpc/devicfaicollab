// src/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/users', require('./user.routes'));
router.use('/projects', require('./project.routes'));
router.use('/ads', require('./ad.routes'));
router.use('/auth', require('./auth.routes')); // Added auth routes

module.exports = router;