import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Phone, Mail, User, Users } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import toast from 'react-hot-toast';

/**
 * Agents Page Component
 * Manage agents (Create, Read, Update, Delete)
 */
const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/agents');
      setAgents(response.data.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenModal = (agent = null) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        email: agent.email,
        mobileNumber: agent.mobileNumber,
        password: '' // Don't show password when editing
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        email: '',
        mobileNumber: '',
        password: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgent(null);
    setFormData({
      name: '',
      email: '',
      mobileNumber: '',
      password: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.mobileNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editingAgent && !formData.password) {
      toast.error('Password is required for new agents');
      return;
    }

    setSubmitting(true);

    try {
      if (editingAgent) {
        // Update existing agent
        const response = await api.put(`/agents/${editingAgent._id}`, {
          name: formData.name,
          email: formData.email,
          mobileNumber: formData.mobileNumber
        });

        if (response.data.success) {
          toast.success('Agent updated successfully');
          fetchAgents();
          handleCloseModal();
        }
      } else {
        // Create new agent
        const response = await api.post('/agents', formData);

        if (response.data.success) {
          toast.success('Agent created successfully');
          fetchAgents();
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error(
        error.response?.data?.message || 'Failed to save agent'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      const response = await api.delete(`/agents/${agentId}`);

      if (response.data.success) {
        toast.success('Agent deleted successfully');
        fetchAgents();
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  if (loading) {
    return (
      <Layout title="Agents">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Agents">
      {/* Header with Add Button */}
      <div className="mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Agents List */}
      {agents.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
          <Users size={48} className="text-dark-textMuted mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
          <p className="text-dark-textMuted mb-4">
            Get started by adding your first agent
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Agent</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent._id}
              className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-blue-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(agent)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(agent._id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-dark-textMuted">
                  <Mail size={16} />
                  <span className="text-sm">{agent.email}</span>
                </div>
                <div className="flex items-center gap-2 text-dark-textMuted">
                  <Phone size={16} />
                  <span className="text-sm">{agent.mobileNumber}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-border">
                <span className="text-xs text-dark-textMuted">
                  Added: {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-border rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-dark-textMuted hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-white"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-white"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium mb-2">
                  Mobile Number (with country code) *
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-white"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>

              {!editingAgent && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-white"
                    placeholder="••••••••"
                    required={!editingAgent}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-dark-bg hover:bg-dark-hover text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingAgent ? 'Update' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Agents;

