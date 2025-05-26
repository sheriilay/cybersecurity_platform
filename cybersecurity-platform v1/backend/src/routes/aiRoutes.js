const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authenticateToken } = require('../middleware/auth');

// Attack Surface Analysis
router.post('/attack-surface', authenticateToken, async (req, res) => {
  try {
    const { target } = req.body;
    if (!target) {
      return res.status(400).json({ error: 'Target is required' });
    }
    const analysis = await aiService.analyzeAttackSurface(target);
    res.json({ analysis });
  } catch (error) {
    console.error('Attack surface analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze attack surface' });
  }
});

// Compliance Analysis
router.post('/compliance', authenticateToken, async (req, res) => {
  try {
    const { data, framework } = req.body;
    if (!data || !framework) {
      return res.status(400).json({ error: 'Data and framework are required' });
    }
    const analysis = await aiService.analyzeCompliance(data, framework);
    res.json({ analysis });
  } catch (error) {
    console.error('Compliance analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze compliance' });
  }
});

// Risk Scoring
router.post('/risk-score', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    const score = await aiService.calculateRiskScore(data);
    res.json({ score });
  } catch (error) {
    console.error('Risk scoring error:', error);
    res.status(500).json({ error: 'Failed to calculate risk score' });
  }
});

// Anomaly Detection
router.post('/anomalies', authenticateToken, async (req, res) => {
  try {
    const { data, context } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    const anomalies = await aiService.detectAnomalies(data, context);
    res.json({ anomalies });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// Get AI Metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = aiService.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve AI metrics' });
  }
});

module.exports = router; 