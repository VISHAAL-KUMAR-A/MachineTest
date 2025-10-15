const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent
} = require('../controllers/agentController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * Agent management routes
 * All routes are protected and admin-only
 */

router.route('/')
  .get(protect, adminOnly, getAgents)
  .post(protect, adminOnly, createAgent);

router.route('/:id')
  .get(protect, adminOnly, getAgent)
  .put(protect, adminOnly, updateAgent)
  .delete(protect, adminOnly, deleteAgent);

module.exports = router;

