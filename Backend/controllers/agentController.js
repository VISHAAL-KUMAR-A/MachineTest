const Agent = require('../models/Agent');

/**
 * Get all agents
 * @route GET /api/agents
 * @access Private
 */
const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching agents'
    });
  }
};

/**
 * Get single agent by ID
 * @route GET /api/agents/:id
 * @access Private
 */
const getAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching agent'
    });
  }
};

/**
 * Create new agent
 * @route POST /api/agents
 * @access Private
 */
const createAgent = async (req, res) => {
  try {
    const { name, email, mobileNumber, password } = req.body;

    // Validate required fields
    if (!name || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if agent already exists
    const agentExists = await Agent.findOne({ email });

    if (agentExists) {
      return res.status(400).json({
        success: false,
        message: 'Agent with this email already exists'
      });
    }

    // Create agent
    const agent = await Agent.create({
      name,
      email,
      mobileNumber,
      password
    });

    // Return agent without password
    const agentData = await Agent.findById(agent._id).select('-password');

    res.status(201).json({
      success: true,
      data: agentData,
      message: 'Agent created successfully'
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating agent'
    });
  }
};

/**
 * Update agent
 * @route PUT /api/agents/:id
 * @access Private
 */
const updateAgent = async (req, res) => {
  try {
    const { name, email, mobileNumber } = req.body;

    // Find agent
    let agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== agent.email) {
      const emailExists = await Agent.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update agent
    agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { name, email, mobileNumber },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: agent,
      message: 'Agent updated successfully'
    });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating agent'
    });
  }
};

/**
 * Delete agent (soft delete)
 * @route DELETE /api/agents/:id
 * @access Private
 */
const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Soft delete by setting isActive to false
    agent.isActive = false;
    await agent.save();

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting agent'
    });
  }
};

module.exports = {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent
};

