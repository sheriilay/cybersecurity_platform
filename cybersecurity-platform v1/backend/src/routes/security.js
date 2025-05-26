const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const { pool } = require('../config/database');
const scanner = require('../services/vulnerabilityScanner');

// Security Logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 50');
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load security logs' });
  }
});

// Security Scan
router.post('/scan', authenticateToken, async (req, res) => {
  const { url } = req.body;
  try {
    const result = await scanner.scan(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

// Threat Monitoring (mock async)
let monitoringResults = {};
router.post('/monitor', authenticateToken, async (req, res) => {
  const { url } = req.body;
  const id = Date.now().toString();
  monitoringResults[id] = { status: 'running', url, history: [] };

  // Simulate periodic scans (every 5 seconds, 3 times)
  let count = 0;
  const maxScans = 3;
  const interval = setInterval(async () => {
    try {
      const result = await scanner.scan(url);
      monitoringResults[id].history.push({
        timestamp: new Date().toISOString(),
        threats: result.details.vulnerabilities || [],
        summary: result.summary
      });
      count++;
      if (count >= maxScans) {
        monitoringResults[id].status = 'done';
        clearInterval(interval);
      }
    } catch (err) {
      monitoringResults[id].status = 'error';
      monitoringResults[id].error = err.message;
      clearInterval(interval);
    }
  }, 5000);

  res.json({ monitoringId: id });
});

// Alias for monitor_status for frontend compatibility
router.get('/monitor/:id', authenticateToken, (req, res) => {
  const result = monitoringResults[req.params.id];
  if (!result) return res.status(404).json({ error: 'Not Found' });
  res.json(result);
});

// Example: Threats Route
router.get('/threats', authenticateToken, async (req, res) => {
  try {
    // Example: const threats = await securityService.getThreats();
    res.json({ message: 'Threats endpoint (implement logic here)' });
  } catch (error) {
    console.error('Threats error:', error);
    res.status(500).json({ error: 'Failed to get threats' });
  }
});

// Ensure the router is properly exported
module.exports = router;