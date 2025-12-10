const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken, JWT_SECRET, JWT_EXPIRES_IN } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      phoneNumber, 
      password, 
      fullName, 
      role,
      city,
      fcmToken 
    } = req.body;

    // Validation
    if (!email || !phoneNumber || !password || !fullName || !role) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email, phone number, password, full name, and role are required' 
      });
    }

    if (!['customer', 'provider'].includes(role)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Role must be either "customer" or "provider"' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [require('sequelize').Op.or]: [
          { email },
          { phoneNumber }
        ]
      } 
    });

    if (existingUser) {
      return res.status(409).json({ 
        status: 'error', 
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      phoneNumber,
      password: hashedPassword,
      fullName,
      role,
      city,
      fcmToken,
      isVerified: false, // Can be verified via OTP later
      isActive: true
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data without password
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to register user',
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }

    // Update FCM token and last login
    if (fcmToken) {
      user.fcmToken = fcmToken;
    }
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data without password
    const userData = user.toJSON();
    delete userData.password;

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to login',
      error: error.message 
    });
  }
});

// Get current user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get profile',
      error: error.message 
    });
  }
});

// Update user profile (protected route)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      fullName, 
      bio, 
      address, 
      city, 
      location,
      profileImageUrl,
      role,
      phoneNumber
    } = req.body;

    // Validate role if provided
    if (role && !['customer', 'provider'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Role must be either "customer" or "provider"'
      });
    }

    // Update user
    await req.user.update({
      ...(fullName && { fullName }),
      ...(bio && { bio }),
      ...(address && { address }),
      ...(city && { city }),
      ...(location && { location }),
      ...(profileImageUrl && { profileImageUrl }),
      ...(role && { role }),
      ...(phoneNumber && { phoneNumber })
    });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

// Update FCM token
router.put('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({
        status: 'error',
        message: 'FCM token is required'
      });
    }

    await req.user.update({ fcmToken });
    
    res.json({
      status: 'success',
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('FCM token update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update FCM token',
      error: error.message
    });
  }
});

// Refresh token (protected route)
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user.id);

    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to refresh token',
      error: error.message 
    });
  }
});

// Update FCM token (protected route)
router.put('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'FCM token is required' 
      });
    }

    await req.user.update({ fcmToken });

    res.json({
      status: 'success',
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('FCM token update error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update FCM token',
      error: error.message 
    });
  }
});

module.exports = router;
