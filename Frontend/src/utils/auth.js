/**
 * Authentication utility functions
 */

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Get current user from localStorage
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Check if current user is admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

/**
 * Check if current user is agent
 * @returns {boolean}
 */
export const isAgent = () => {
  const user = getCurrentUser();
  return user?.role === 'agent';
};

/**
 * Save user and token to localStorage
 * @param {Object} userData
 */
export const saveUserData = (userData) => {
  localStorage.setItem('token', userData.token);
  const userInfo = {
    _id: userData._id,
    email: userData.email,
    role: userData.role
  };
  
  // Add name for agents
  if (userData.role === 'agent' && userData.name) {
    userInfo.name = userData.name;
  }
  
  localStorage.setItem('user', JSON.stringify(userInfo));
};

/**
 * Clear user data and logout
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

