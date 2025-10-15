const mongoose = require('mongoose');

/**
 * List Schema
 * Represents individual items from uploaded CSV files
 * Each item is assigned to an agent
 */
const listSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: function() {
      return !this.subAgent;
    }
  },
  subAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubAgent'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'uploadedByModel',
    required: true
  },
  uploadedByModel: {
    type: String,
    required: true,
    enum: ['User', 'Agent']
  },
  uploadBatch: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
listSchema.index({ agent: 1, uploadBatch: 1 });

module.exports = mongoose.model('List', listSchema);

