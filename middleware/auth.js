//const session = require('express-session');

// Middleware to check if user is authenticated
exports.auth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    req.user = { id: req.session.userId };
    next();
    console.log('User ID:', req.session.userId);
};