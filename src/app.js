// src/app.js
require('dotenv').config();
const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const session      = require('express-session');
const passport     = require('./config/passport');    // require the configured passport
const connectDB    = require('./config/db');
const { protect }  = require('./middlewares/auth.middleware');

const app = express();
connectDB();

// CORS: allow frontend origins
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://icfaicollab.vercel.app'
    ],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session for OAuth handshake
app.use(
  session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie: {
      secure:   process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Static assets
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', require('./routes'));

// Page routes
app.get('/',                  (req, res) => res.sendFile(path.join(__dirname, '../public/landing.html')));
app.get('/signup',            (req, res) => res.sendFile(path.join(__dirname, '../public/signup.html')));
app.get('/login',             (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/upload',  protect,  (req, res) => res.sendFile(path.join(__dirname, '../public/upload.html')));
app.get('/projects',          (req, res) => res.sendFile(path.join(__dirname, '../public/view-projects.html')));
app.get('/project/:id/edit',  protect,  (req, res) => res.sendFile(path.join(__dirname, '../public/edit-project.html')));
app.get('/project/:id',       (req, res) => res.sendFile(path.join(__dirname, '../public/view-project.html')));
app.get('/ads',      protect, (req, res) => res.sendFile(path.join(__dirname, '../public/ads.html')));
app.get('/view-ads',          (req, res) => res.sendFile(path.join(__dirname, '../public/view-ads.html')));
app.get('/me',       protect, (req, res) => res.sendFile(path.join(__dirname, '../public/user.html')));
app.get('/all-users',protect,  (req, res) => res.sendFile(path.join(__dirname, '../public/all-user.html')));
app.get('/settings', protect,  (req, res) => res.sendFile(path.join(__dirname, '../public/settings.html')));
app.get('/about',    protect,  (req, res) => res.sendFile(path.join(__dirname, '../public/about.html')));
app.get('/users/:username',    (req, res) => res.sendFile(path.join(__dirname, '../public/profile.html')));

module.exports = app;
