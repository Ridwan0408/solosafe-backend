const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const passport = require('passport');
const { register, login, logout, forgotPassword} = require('../controllers/authControllers');

// @route   POST api/auth/register
// @desc    Register a new solo traveler
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/forgot-password').post(forgotPassword);

router.route('/google').get(passport.authenticate('google', { scope: ['profile', 'email'], state: true}));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      res.redirect(`${process.env.CLIENT_URL}/dashboard.html?token=${token}`);
      // req.session.regenerate(err => {
      // if (err) {
      //   console.error('Session regeneration error:', err);  
      //   return res.redirect('/login');
      // }
      // req.session.userId = req.user._id;

      // req.session.save((saveErr) => {
      //   if (saveErr) {
      //     console.error('Session save error:', saveErr);
      //     return res.redirect('/login');
      //   }
      //   res.redirect(`${process.env.CLIENT_URL}/dashboard.html`);
      // });
      // }); 
  }
  catch (err) {
      console.error('Error during Google OAuth callback:', err);
      res.redirect(`${process.env.CLIENT_URL}/login.html?error=oauth_failed`);
    }
  }
);


module.exports = router;