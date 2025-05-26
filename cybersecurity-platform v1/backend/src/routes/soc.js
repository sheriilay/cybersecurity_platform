const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const socService = require('../services/socservice');

router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const events = await socService.getLatestEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load SOC events' });
  }
});

module.exports = router; 