const express = require('express');
const router = express.Router();
const {
  getSubAgents,
  getSubAgent,
  createSubAgent,
  updateSubAgent,
  deleteSubAgent
} = require('../controllers/subAgentController');
const { protect, agentOnly } = require('../middleware/auth');

/**
 * Sub-agent management routes
 * All routes are protected and accessible only by agents
 */

router.get('/', protect, agentOnly, getSubAgents);
router.get('/:id', protect, agentOnly, getSubAgent);
router.post('/', protect, agentOnly, createSubAgent);
router.put('/:id', protect, agentOnly, updateSubAgent);
router.delete('/:id', protect, agentOnly, deleteSubAgent);

module.exports = router;

