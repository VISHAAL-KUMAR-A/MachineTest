const User = require('../models/User');
const Agent = require('../models/Agent');
const generateToken = require('../utils/generateToken');

/**
 * Login user or agent
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user;
    let userRole;

    // If role is specified, ONLY check that specific role
    if (role === 'agent') {
      user = await Agent.findOne({ email });
      userRole = 'agent';
    } else if (role === 'admin') {
      user = await User.findOne({ email });
      userRole = 'admin';
    } else {
      // If no role specified (backwards compatibility), check both
      user = await User.findOne({ email });
      if (user) {
        userRole = 'admin';
      } else {
        user = await Agent.findOne({ email });
        if (user) {
          userRole = 'agent';
        }
      }
    }

    // Check if user exists and password is correct
    if (user && (await user.matchPassword(password))) {
      const responseData = {
        _id: user._id,
        email: user.email,
        role: userRole,
        token: generateToken(user._id, userRole)
      };

      // Add name for agents
      if (userRole === 'agent') {
        responseData.name = user.name;
      }

      res.json({
        success: true,
        data: responseData,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Register user (for initial setup)
 * @route POST /api/auth/register
 * @access Public (can be protected in production)
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      role: 'admin'
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role)
        },
        message: 'User registered successfully'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const userData = {
      _id: req.user._id,
      email: req.user.email,
      role: req.userType
    };

    // Add name for agents
    if (req.userType === 'agent') {
      userData.name = req.user.name;
      userData.mobileNumber = req.user.mobileNumber;
    }
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  register,
  getMe
};

