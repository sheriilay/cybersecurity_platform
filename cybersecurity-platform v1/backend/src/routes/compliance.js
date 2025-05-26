const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const complianceService = require('../services/complianceservice');

router.get('/check', authenticateToken, async (req, res) => {
  try {
    const result = await complianceService.checkCompliance();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Compliance check failed' });
  }
});

module.exports = router; 