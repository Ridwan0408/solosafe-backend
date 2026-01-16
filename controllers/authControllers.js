const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Built-in Node module

exports.register = async (req, res) => {
  const { name, email, password, } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user instance
    user = new User({
      name,
      email,
      password,
      //emergencyContacts // Array of { name, phone, email }
    });

    await user.save();
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }

    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during registration');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
    try { 
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }   
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Set session
        req.session.userId = user._id;
        res.status(200).json({ message: 'Login successful',
        user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error during login');
    }
};

exports.logout = (req, res) => {    
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed'});
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logout successful' });
    });
}

// Forgot Password - Generate Reset Token
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send email with resetToken (use your existing emailService)
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail(user.email, "Password Reset", resetUrl);
  res.json({ message: "Reset link sent to email" });
};