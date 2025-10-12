import React, { useState, useEffect } from 'react';
import { Users, Upload, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import toast from 'react-hot-toast';

/**
 * Dashboard Page Component
 * Shows overview statistics and recent activity
 */
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalLists: 0,
    totalBatches: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentBatches, setRecentBatches] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [agentsRes, batchesRes, listsRes] = await Promise.all([
        api.get('/agents'),
        api.get('/lists/batches'),
        api.get('/lists')
      ]);

      setStats({
        totalAgents: agentsRes.data.count || 0,
        totalBatches: batchesRes.data.data.length || 0,
        totalLists: listsRes.data.count || 0
      });

      setRecentBatches(batchesRes.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, link }) => (
    <Link to={link} className="block">
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-blue-600 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
          <TrendingUp size={20} className="text-green-500" />
        </div>
        <h3 className="text-dark-textMuted text-sm mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total Agents"
          value={stats.totalAgents}
          color="bg-blue-600"
          link="/agents"
        />
        <StatCard
          icon={FileText}
          title="Total Lists"
          value={stats.totalLists}
          color="bg-green-600"
          link="/upload"
        />
        <StatCard
          icon={Upload}
          title="Upload Batches"
          value={stats.totalBatches}
          color="bg-purple-600"
          link="/upload"
        />
      </div>

      {/* Recent Uploads */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Uploads</h3>
        
        {recentBatches.length === 0 ? (
          <div className="text-center py-12">
            <Upload size={48} className="text-dark-textMuted mx-auto mb-4" />
            <p className="text-dark-textMuted mb-4">No uploads yet</p>
            <Link
              to="/upload"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Upload Your First List
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-dark-textMuted font-medium">Batch ID</th>
                  <th className="text-left py-3 px-4 text-dark-textMuted font-medium">Records</th>
                  <th className="text-left py-3 px-4 text-dark-textMuted font-medium">Uploaded By</th>
                  <th className="text-left py-3 px-4 text-dark-textMuted font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((batch) => (
                  <tr key={batch.batchId} className="border-b border-dark-border hover:bg-dark-hover">
                    <td className="py-3 px-4 font-mono text-sm">{batch.batchId}</td>
                    <td className="py-3 px-4">{batch.recordCount}</td>
                    <td className="py-3 px-4">{batch.uploadedBy}</td>
                    <td className="py-3 px-4 text-dark-textMuted">
                      {new Date(batch.uploadedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/agents"
          className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-blue-600 transition-colors"
        >
          <Users size={32} className="text-blue-600 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Manage Agents</h3>
          <p className="text-dark-textMuted">Add, edit, or remove agents from the system</p>
        </Link>

        <Link
          to="/upload"
          className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-blue-600 transition-colors"
        >
          <Upload size={32} className="text-green-600 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Upload Lists</h3>
          <p className="text-dark-textMuted">Upload CSV/Excel files and distribute to agents</p>
        </Link>
      </div>
    </Layout>
  );
};

export default Dashboard;

