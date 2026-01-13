const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, logout, forgotPassword} = require('../controllers/authControllers');
const { $where } = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a new solo traveler
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/forgot-password').post(forgotPassword);

router.route('/google').get(passport.authenticate('google', { scope: ['profile', 'email'], state: true}));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.session.regenerate(err => {
    if (err) {
      return res.redirect('/login');
    }
    req.session.userId = req.user._id;
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }); 
  }
);

module.exports = router;