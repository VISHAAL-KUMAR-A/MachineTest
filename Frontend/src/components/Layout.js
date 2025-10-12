import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Upload, LogOut } from 'lucide-react';
import { logout, getCurrentUser } from '../utils/auth';
import toast from 'react-hot-toast';

/**
 * Layout Component
 * Provides navigation and consistent layout across pages
 */
const Layout = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/agents', icon: Users, label: 'Agents' },
    { path: '/upload', icon: Upload, label: 'Upload Lists' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-card border-r border-dark-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-8">Agent Manager</h1>
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-dark-textMuted hover:bg-dark-hover hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-64 p-6 border-t border-dark-border">
          <div className="mb-3">
            <p className="text-sm text-dark-textMuted">Logged in as</p>
            <p className="text-white font-medium truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6">{title}</h2>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

