import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../utils/auth';

/**
 * Private Route Component
 * Redirects to login if user is not authenticated
 * Supports role-based access control
 */
const PrivateRoute = ({ children, adminOnly = false, agentOnly = false }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getCurrentUser();

  // Check role-based access
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/agent-dashboard" replace />;
  }

  if (agentOnly && user?.role !== 'agent') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;


