const express = require('express');
const router = express.Router();
const { register, login, logout} = require('../controllers/authControllers');

// @route   POST api/auth/register
// @desc    Register a new solo traveler
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').post(logout);


module.exports = router;