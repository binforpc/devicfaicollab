// src/config/passport.js
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');
const crypto = require('crypto');

const CALLBACK =
  process.env.NODE_ENV === 'production'
    ? process.env.GOOGLE_CALLBACK_URL_PROD
    : process.env.GOOGLE_CALLBACK_URL_DEV;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        let user = await User.findOne({ email });

        if (user) {
          // Flow 4: already local → block OAuth
          if (user.authMethod === 'local') {
            return done(
              new Error(
                'You have registered with email and password; please log in with those.'
              )
            );
          }
          // existing Google user → proceed
          return done(null, user);
        }

        // Flow 1 & 3: brand‑new Google user
        const base = profile.displayName.replace(/\s+/g, '').toLowerCase();
        let username = base;
        if (await User.findOne({ username })) {
          username = `${base}_${Date.now()}`;
        }
        user = await User.create({
          name: profile.displayName,
          username,
          email,
          password: crypto.randomBytes(16).toString('hex'),
          authMethod: 'google',
          domains: [],
          skills: [],
          bio: '',
          profilePic: profile.photos[0]?.value || ''
        });
        return done(null, user, { newUser: true });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id);
    done(null, u);
  } catch (e) {
    done(e);
  }
});

module.exports = passport;