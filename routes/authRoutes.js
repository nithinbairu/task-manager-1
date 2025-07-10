const express = require('express');
const passport = require('passport');
const router = express.Router();


const authMiddleware = require('../middlewares/auth');
const { register, login } = require('../controllers/authController');
const { generateDescription } = require('../controllers/aiController');
const { adminRegister, adminLogin } = require('../controllers/adminAuthController');

router.post('/register', register);
router.post('/login', login);

router.post('/adminRegister', adminRegister);
router.post('/adminLogin', adminLogin);

// Protect the generate-description route
router.post('/generate-description', authMiddleware, generateDescription);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const jwt = require('jsonwebtoken');
    const user = req.user;
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
  });

module.exports = router;
