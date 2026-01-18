const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    try {
      let user = await User.findOneAndUpdate(
        { email: email },
        {
          $set: {
            googleId: profile.id,
            name: profile.displayName
          }
        },
        { 
          upsert: true,
          new: true,
          runValidators: true
        }
      );
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   const user = await User.findById(id);
//   done(null, user);
// });