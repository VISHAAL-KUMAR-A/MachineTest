const mongoose = require('mongoose');

/**
 * SubAgent Schema
 * Represents sub-agents who are created by agents and assigned tasks from agent uploads
 * Sub-agents don't have login credentials
 */
const subAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sub-agent name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  parentAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Parent agent is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
subAgentSchema.index({ parentAgent: 1, isActive: 1 });

module.exports = mongoose.model('SubAgent', subAgentSchema);

