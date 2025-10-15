import React, { useState, useEffect } from 'react';
import { ClipboardList, Phone, User, Calendar, LogOut, Users, Upload, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getCurrentUser, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

/**
 * Agent Dashboard Component
 * Shows assigned tasks for logged-in agent
 */
const AgentDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalBatches: 0,
    totalSubAgents: 0
  });
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTasks();
    fetchSubAgentsCount();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const response = await api.get('/lists/my-tasks');
      
      if (response.data.success) {
        setTasks(response.data.data);
        setStats(prev => ({
          ...prev,
          totalTasks: response.data.count,
          totalBatches: response.data.data.length
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubAgentsCount = async () => {
    try {
      const response = await api.get('/subagents');
      if (response.data.success) {
        setStats(prev => ({
          ...prev,
          totalSubAgents: response.data.count
        }));
      }
    } catch (error) {
      console.error('Error fetching sub-agents count:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ClipboardList size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
                <p className="text-dark-textMuted text-sm">Welcome, {currentUser?.name || currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/agent/subagents')}
              className="bg-dark-card border border-dark-border rounded-lg p-6 hover:bg-dark-hover transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <Users size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Manage Sub-Agents</p>
                  <p className="text-dark-textMuted text-sm">Create and manage your sub-agents</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/agent/upload')}
              className="bg-dark-card border border-dark-border rounded-lg p-6 hover:bg-dark-hover transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-600 rounded-lg">
                  <Upload size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Upload Lists</p>
                  <p className="text-dark-textMuted text-sm">Upload files for sub-agents</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/agent/upload')}
              className="bg-dark-card border border-dark-border rounded-lg p-6 hover:bg-dark-hover transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-600 rounded-lg">
                  <FileText size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">View Distributions</p>
                  <p className="text-dark-textMuted text-sm">See how lists are distributed</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textMuted text-sm mb-1">My Tasks Assigned</p>
                <p className="text-3xl font-bold text-white">{stats.totalTasks}</p>
              </div>
              <div className="p-3 bg-blue-600 rounded-lg">
                <ClipboardList size={32} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textMuted text-sm mb-1">Upload Batches</p>
                <p className="text-3xl font-bold text-white">{stats.totalBatches}</p>
              </div>
              <div className="p-3 bg-green-600 rounded-lg">
                <Calendar size={32} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textMuted text-sm mb-1">My Sub-Agents</p>
                <p className="text-3xl font-bold text-white">{stats.totalSubAgents}</p>
              </div>
              <div className="p-3 bg-purple-600 rounded-lg">
                <Users size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-dark-card border border-dark-border rounded-lg">
          <div className="p-6 border-b border-dark-border">
            <h2 className="text-xl font-semibold text-white">My Assigned Tasks</h2>
            <p className="text-dark-textMuted text-sm mt-1">
              All tasks that have been assigned to you
            </p>
          </div>

          {tasks.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList size={48} className="text-dark-textMuted mx-auto mb-4" />
              <p className="text-dark-textMuted text-lg mb-2">No tasks assigned yet</p>
              <p className="text-dark-textMuted text-sm">
                Your assigned tasks will appear here once the admin uploads and distributes lists.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {tasks.map((batch) => (
                <div key={batch.batchId} className="border border-dark-border rounded-lg overflow-hidden">
                  {/* Batch Header */}
                  <div className="bg-dark-hover px-4 py-3 border-b border-dark-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">
                          Batch ID: <span className="font-mono text-sm">{batch.batchId}</span>
                        </p>
                        <p className="text-dark-textMuted text-sm">
                          {batch.tasks.length} task{batch.tasks.length !== 1 ? 's' : ''} • 
                          Uploaded by {batch.uploadedBy} • 
                          {new Date(batch.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-bg">
                        <tr>
                          <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Name</th>
                          <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Phone</th>
                          <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Notes</th>
                          <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Assigned On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.tasks.map((task, index) => (
                          <tr 
                            key={task._id} 
                            className={`border-t border-dark-border hover:bg-dark-hover ${
                              index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-bg'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User size={16} className="text-dark-textMuted" />
                                <span className="text-white">{task.firstName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Phone size={16} className="text-dark-textMuted" />
                                <span className="text-white font-mono text-sm">{task.phone}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-dark-textMuted">
                                {task.notes || <span className="italic">No notes</span>}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-dark-textMuted text-sm">
                              {new Date(task.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgentDashboard;

