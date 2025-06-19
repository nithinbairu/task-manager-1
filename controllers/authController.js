const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hash, role });

    // Send success response (exclude password)
    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ message: 'Registration failed', error: err.message });
  }
};
// server/controllers/authController.js

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    const user = await User.findOne({ email });
    console.log('User found:', user);

    if (!user) return res.status(401).json({ message: 'Invalid email' });

    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google login. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
     console.log('JWT_SECRET (authController):', process.env.JWT_SECRET);

    // --- IMPORTANT CHANGE HERE ---
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour. Adjust as needed (e.g., '1d' for 1 day)
    );
    // ----------------------------

    res.json({ token, user });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(400).json({ message: 'Login failed', error: err.message });
  }
};