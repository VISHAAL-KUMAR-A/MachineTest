const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent
} = require('../controllers/agentController');
const { protect } = require('../middleware/auth');

/**
 * Agent management routes
 * All routes are protected (require authentication)
 */

router.route('/')
  .get(protect, getAgents)
  .post(protect, createAgent);

router.route('/:id')
  .get(protect, getAgent)
  .put(protect, updateAgent)
  .delete(protect, deleteAgent);

module.exports = router;

