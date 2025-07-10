const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hash, role });

    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ message: 'Registration failed', error: err.message });
  }
};

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

    if (!user.active) {
  return res.status(403).json({ message: 'Account deactivated by admin' });
}


    const token = jwt.sign(
      { id: user._id, role: user.role, name:user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(400).json({ message: 'Login failed', error: err.message });
  }
};