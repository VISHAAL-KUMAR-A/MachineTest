import React, { useState, useEffect } from 'react';
import { Upload, FileText, User, Users, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Agent Upload Lists Component
 * Allows agents to upload CSV/Excel files and distribute to sub-agents
 */
const AgentUploadLists = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [distributedLists, setDistributedLists] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [subAgentCount, setSubAgentCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubAgentsCount();
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchDistributedLists(selectedBatch);
    } else {
      fetchDistributedLists();
    }
  }, [selectedBatch]);

  const fetchSubAgentsCount = async () => {
    try {
      const response = await api.get('/subagents');
      if (response.data.success) {
        setSubAgentCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching sub-agents count:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get('/lists/my-batches');
      setBatches(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedBatch(response.data.data[0].batchId);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchDistributedLists = async (batchId = '') => {
    setLoading(true);
    try {
      const url = batchId ? `/lists/my-uploads?uploadBatch=${batchId}` : '/lists/my-uploads';
      const response = await api.get(url);
      setDistributedLists(response.data.data);
    } catch (error) {
      console.error('Error fetching lists:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load distributed lists');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      const allowedExtensions = ['.csv', '.xlsx', '.xls'];
      const fileName = file.name.toLowerCase();
      const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));

      if (!isValid) {
        toast.error('Invalid file type. Only CSV, XLSX, and XLS files are allowed.');
        e.target.value = '';
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (subAgentCount === 0) {
      toast.error('You need to create at least one sub-agent before uploading');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/lists/agent-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const { duplicatesRemoved } = response.data.data;
        
        let message = response.data.message;
        if (duplicatesRemoved > 0) {
          message += ` (${duplicatesRemoved} duplicate${duplicatesRemoved > 1 ? 's' : ''} removed)`;
        }
        
        toast.success(message);
        setSelectedFile(null);
        // Reset file input
        document.getElementById('fileInput').value = '';
        
        // Refresh data
        await fetchBatches();
        await fetchDistributedLists();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to upload file'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/agent-dashboard')}
              className="p-2 bg-dark-card border border-dark-border rounded-lg hover:bg-dark-hover transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Upload Lists for Sub-Agents</h1>
          </div>
          <p className="text-dark-textMuted ml-14">
            Upload CSV/Excel files to distribute tasks among your sub-agents
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Upload CSV/Excel File</h3>
          
          {subAgentCount === 0 ? (
            <div className="p-6 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p className="text-yellow-400 mb-3">
                <strong>Notice:</strong> You need to create at least one sub-agent before uploading files.
              </p>
              <a
                href="/agent/subagents"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Users size={20} />
                <span>Manage Sub-Agents</span>
              </a>
            </div>
          ) : (
            <>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Select File (CSV, XLSX, XLS)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="fileInput"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                    />
                    <button
                      type="submit"
                      disabled={!selectedFile || uploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span>Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-dark-textMuted">
                    <FileText size={16} />
                    <span>{selectedFile.name}</span>
                    <span>({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
              </form>

              <div className="mt-4 p-4 bg-dark-bg rounded-lg border border-dark-border">
                <p className="text-sm text-dark-textMuted">
                  <strong className="text-white">Required columns:</strong> FirstName, Phone, Notes
                </p>
                <p className="text-sm text-dark-textMuted mt-1">
                  Lists will be distributed equally among your {subAgentCount} active sub-agent{subAgentCount !== 1 ? 's' : ''}.
                </p>
                <p className="text-sm text-dark-textMuted mt-1">
                  <strong className="text-white">Note:</strong> Duplicate entries (based on FirstName, Phone, or Notes) will be automatically removed before distribution.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Batch Filter */}
        {batches.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Filter by Upload Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.batchId} value={batch.batchId}>
                  {new Date(batch.uploadedAt).toLocaleString()} - {batch.recordCount} records
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Distributed Lists */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Distributed Lists</h3>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : distributedLists.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="text-dark-textMuted mx-auto mb-4" />
              <p className="text-dark-textMuted">No lists uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {distributedLists.map((item) => (
                <div
                  key={item.subAgent._id}
                  className="bg-dark-bg border border-dark-border rounded-lg p-6"
                >
                  {/* Sub-Agent Header */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-border">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <User size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white">{item.subAgent.name}</h4>
                      <p className="text-sm text-dark-textMuted">{item.subAgent.email}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                        {item.lists.length} items
                      </span>
                    </div>
                  </div>

                  {/* Lists Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left py-2 px-3 text-dark-textMuted font-medium">#</th>
                          <th className="text-left py-2 px-3 text-dark-textMuted font-medium">First Name</th>
                          <th className="text-left py-2 px-3 text-dark-textMuted font-medium">Phone</th>
                          <th className="text-left py-2 px-3 text-dark-textMuted font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.lists.map((list, index) => (
                          <tr key={list._id} className="border-b border-dark-border hover:bg-dark-hover">
                            <td className="py-2 px-3 text-dark-textMuted">{index + 1}</td>
                            <td className="py-2 px-3 text-white">{list.firstName}</td>
                            <td className="py-2 px-3 text-white">{list.phone}</td>
                            <td className="py-2 px-3 text-dark-textMuted">{list.notes || '-'}</td>
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
      </div>
    </div>
  );
};

export default AgentUploadLists;

