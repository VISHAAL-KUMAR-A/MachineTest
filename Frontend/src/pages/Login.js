import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { saveUserData, isAuthenticated, getCurrentUser } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Login Page Component
 * Handles user and agent authentication
 */
const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin' // default to admin
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user.role === 'admin') {
        navigate('/');
      } else if (user.role === 'agent') {
        navigate('/agent-dashboard');
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);

      if (response.data.success) {
        saveUserData(response.data.data);
        toast.success('Login successful!');
        
        // Redirect based on role
        if (response.data.data.role === 'admin') {
          navigate('/');
        } else if (response.data.data.role === 'agent') {
          navigate('/agent-dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-dark-textMuted">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-card rounded-lg border border-dark-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2">
                Login As
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle size={18} className="text-dark-textMuted" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-dark-textMuted" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                  placeholder={formData.role === 'admin' ? 'admin@example.com' : 'agent@example.com'}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-dark-textMuted" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Note */}
          {formData.role === 'admin' && (
            <div className="mt-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
              <p className="text-sm text-dark-textMuted">
                <strong className="text-white">Note:</strong> Use the /api/auth/register endpoint to create an admin account if you haven't already.
              </p>
            </div>
          )}
          
          {formData.role === 'agent' && (
            <div className="mt-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
              <p className="text-sm text-dark-textMuted">
                <strong className="text-white">Agent Login:</strong> Use the credentials provided by your administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;


