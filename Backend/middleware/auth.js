const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');

/**
 * Middleware to protect routes
 * Verifies JWT token and attaches user/agent to request
 */
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's an admin or agent based on the role in the token
      if (decoded.role === 'admin') {
        req.user = await User.findById(decoded.id).select('-password');
        req.userType = 'admin';
      } else if (decoded.role === 'agent') {
        req.user = await Agent.findById(decoded.id).select('-password');
        req.userType = 'agent';
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

/**
 * Middleware to restrict routes to admin only
 */
const adminOnly = async (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

/**
 * Middleware to restrict routes to agents only
 */
const agentOnly = async (req, res, next) => {
  if (req.userType !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Agents only.'
    });
  }
  next();
};

module.exports = { protect, adminOnly, agentOnly };

