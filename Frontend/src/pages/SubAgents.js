import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, X, Mail, Phone, User, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Sub-Agents Management Component for Agents
 * Allows agents to create and manage their sub-agents
 */
const SubAgents = () => {
  const [subAgents, setSubAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubAgent, setCurrentSubAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubAgents();
  }, []);

  const fetchSubAgents = async () => {
    try {
      const response = await api.get('/subagents');
      if (response.data.success) {
        setSubAgents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sub-agents:', error);
      toast.error('Failed to load sub-agents');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editMode && currentSubAgent) {
        // Update existing sub-agent
        const response = await api.put(`/subagents/${currentSubAgent._id}`, formData);
        if (response.data.success) {
          toast.success('Sub-agent updated successfully');
          await fetchSubAgents();
          closeModal();
        }
      } else {
        // Create new sub-agent
        const response = await api.post('/subagents', formData);
        if (response.data.success) {
          toast.success('Sub-agent created successfully');
          await fetchSubAgents();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving sub-agent:', error);
      toast.error(error.response?.data?.message || 'Failed to save sub-agent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subAgent) => {
    setCurrentSubAgent(subAgent);
    setFormData({
      name: subAgent.name,
      email: subAgent.email,
      mobileNumber: subAgent.mobileNumber
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (subAgentId) => {
    if (!window.confirm('Are you sure you want to delete this sub-agent?')) {
      return;
    }

    try {
      const response = await api.delete(`/subagents/${subAgentId}`);
      if (response.data.success) {
        toast.success('Sub-agent deleted successfully');
        await fetchSubAgents();
      }
    } catch (error) {
      console.error('Error deleting sub-agent:', error);
      toast.error(error.response?.data?.message || 'Failed to delete sub-agent');
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentSubAgent(null);
    setFormData({
      name: '',
      email: '',
      mobileNumber: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentSubAgent(null);
    setFormData({
      name: '',
      email: '',
      mobileNumber: ''
    });
    setFormErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/agent-dashboard')}
              className="p-2 bg-dark-card border border-dark-border rounded-lg hover:bg-dark-hover transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">My Sub-Agents</h1>
              <p className="text-dark-textMuted">
                Manage your sub-agents and distribute tasks to them
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Sub-Agent</span>
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Users size={32} className="text-white" />
            </div>
            <div>
              <p className="text-dark-textMuted text-sm">Total Sub-Agents</p>
              <p className="text-3xl font-bold text-white">{subAgents.length}</p>
            </div>
          </div>
        </div>

        {/* Sub-Agents List */}
        <div className="bg-dark-card border border-dark-border rounded-lg">
          <div className="p-6 border-b border-dark-border">
            <h2 className="text-xl font-semibold text-white">Sub-Agents List</h2>
          </div>

          {subAgents.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="text-dark-textMuted mx-auto mb-4" />
              <p className="text-dark-textMuted text-lg mb-2">No sub-agents yet</p>
              <p className="text-dark-textMuted text-sm mb-4">
                Create sub-agents to distribute your tasks efficiently
              </p>
              <button
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                <span>Add Your First Sub-Agent</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg">
                  <tr>
                    <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Name</th>
                    <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Email</th>
                    <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Mobile</th>
                    <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Created</th>
                    <th className="text-left py-3 px-4 text-dark-textMuted font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subAgents.map((subAgent, index) => (
                    <tr 
                      key={subAgent._id} 
                      className={`border-t border-dark-border hover:bg-dark-hover ${
                        index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-bg'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-dark-textMuted" />
                          <span className="text-white font-medium">{subAgent.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-dark-textMuted" />
                          <span className="text-white">{subAgent.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-dark-textMuted" />
                          <span className="text-white">{subAgent.mobileNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-dark-textMuted text-sm">
                        {new Date(subAgent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(subAgent)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(subAgent._id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-border rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h3 className="text-xl font-semibold text-white">
                {editMode ? 'Edit Sub-Agent' : 'Add New Sub-Agent'}
              </h3>
              <button
                onClick={closeModal}
                className="text-dark-textMuted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 bg-dark-bg border ${
                    formErrors.name ? 'border-red-500' : 'border-dark-border'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600`}
                  placeholder="Enter sub-agent name"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 bg-dark-bg border ${
                    formErrors.email ? 'border-red-500' : 'border-dark-border'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600`}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 bg-dark-bg border ${
                    formErrors.mobileNumber ? 'border-red-500' : 'border-dark-border'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600`}
                  placeholder="Enter mobile number"
                />
                {formErrors.mobileNumber && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.mobileNumber}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg hover:bg-dark-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editMode ? 'Update' : 'Create'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAgents;

