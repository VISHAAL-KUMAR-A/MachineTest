const SubAgent = require('../models/SubAgent');

/**
 * Get all sub-agents for the logged-in agent
 * @route GET /api/subagents
 * @access Private (Agent only)
 */
const getSubAgents = async (req, res) => {
  try {
    // Only agents can access this
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const agentId = req.user._id;
    const subAgents = await SubAgent.find({ parentAgent: agentId, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: subAgents.length,
      data: subAgents
    });
  } catch (error) {
    console.error('Get sub-agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sub-agents'
    });
  }
};

/**
 * Get single sub-agent by ID
 * @route GET /api/subagents/:id
 * @access Private (Agent only)
 */
const getSubAgent = async (req, res) => {
  try {
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const subAgent = await SubAgent.findById(req.params.id);

    if (!subAgent) {
      return res.status(404).json({
        success: false,
        message: 'Sub-agent not found'
      });
    }

    // Ensure the sub-agent belongs to the logged-in agent
    if (subAgent.parentAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This sub-agent does not belong to you.'
      });
    }

    res.json({
      success: true,
      data: subAgent
    });
  } catch (error) {
    console.error('Get sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sub-agent'
    });
  }
};

/**
 * Create new sub-agent
 * @route POST /api/subagents
 * @access Private (Agent only)
 */
const createSubAgent = async (req, res) => {
  try {
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const { name, email, mobileNumber } = req.body;

    // Validate required fields
    if (!name || !email || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if sub-agent with this email already exists for this agent
    const subAgentExists = await SubAgent.findOne({ 
      email, 
      parentAgent: req.user._id,
      isActive: true 
    });

    if (subAgentExists) {
      return res.status(400).json({
        success: false,
        message: 'Sub-agent with this email already exists'
      });
    }

    // Create sub-agent
    const subAgent = await SubAgent.create({
      name,
      email,
      mobileNumber,
      parentAgent: req.user._id
    });

    res.status(201).json({
      success: true,
      data: subAgent,
      message: 'Sub-agent created successfully'
    });
  } catch (error) {
    console.error('Create sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating sub-agent'
    });
  }
};

/**
 * Update sub-agent
 * @route PUT /api/subagents/:id
 * @access Private (Agent only)
 */
const updateSubAgent = async (req, res) => {
  try {
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const { name, email, mobileNumber } = req.body;

    // Find sub-agent
    let subAgent = await SubAgent.findById(req.params.id);

    if (!subAgent) {
      return res.status(404).json({
        success: false,
        message: 'Sub-agent not found'
      });
    }

    // Ensure the sub-agent belongs to the logged-in agent
    if (subAgent.parentAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This sub-agent does not belong to you.'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== subAgent.email) {
      const emailExists = await SubAgent.findOne({ 
        email, 
        parentAgent: req.user._id,
        isActive: true 
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update sub-agent
    subAgent = await SubAgent.findByIdAndUpdate(
      req.params.id,
      { name, email, mobileNumber },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: subAgent,
      message: 'Sub-agent updated successfully'
    });
  } catch (error) {
    console.error('Update sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating sub-agent'
    });
  }
};

/**
 * Delete sub-agent (soft delete)
 * @route DELETE /api/subagents/:id
 * @access Private (Agent only)
 */
const deleteSubAgent = async (req, res) => {
  try {
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const subAgent = await SubAgent.findById(req.params.id);

    if (!subAgent) {
      return res.status(404).json({
        success: false,
        message: 'Sub-agent not found'
      });
    }

    // Ensure the sub-agent belongs to the logged-in agent
    if (subAgent.parentAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This sub-agent does not belong to you.'
      });
    }

    // Soft delete by setting isActive to false
    subAgent.isActive = false;
    await subAgent.save();

    res.json({
      success: true,
      message: 'Sub-agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting sub-agent'
    });
  }
};

module.exports = {
  getSubAgents,
  getSubAgent,
  createSubAgent,
  updateSubAgent,
  deleteSubAgent
};

