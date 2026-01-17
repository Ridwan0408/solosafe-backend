const jwt = require('jsonwebtoken');

// Middleware to check if user is authenticated
// exports.auth = (req, res, next) => {
//     if (!req.session.userId) return res.redirect('/login');
//     req.user = { id: req.session.userId };
//     next();
//     console.log('User ID:', req.session.userId);
// };

// Middleware to verify JWT token
exports.auth = (req, res, next) => {
    let token;

    //check if token exist in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
            token = req.headers.authorization.split(' ')[1]; // Get token from "Bearer <token>"
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.userId = decoded.userId; // Attach userId to request object
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorised, Token is not valid', error: error.message });
        }
    } 

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
};