import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import UploadLists from './pages/UploadLists';
import PrivateRoute from './components/PrivateRoute';

/**
 * Main App Component
 * Handles routing and global configuration
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-dark-text">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #475569'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#e2e8f0',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#e2e8f0',
              },
            },
          }}
        />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/agents" element={<PrivateRoute><Agents /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadLists /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

