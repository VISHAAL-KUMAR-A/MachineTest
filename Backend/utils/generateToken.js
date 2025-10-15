const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user/agent authentication
 * @param {String} id - User/Agent ID
 * @param {String} role - User role (admin or agent)
 * @returns {String} JWT token
 */
const generateToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token expires in 30 days
  });
};

module.exports = generateToken;

