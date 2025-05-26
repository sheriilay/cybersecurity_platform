const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const cryptoService = require('../services/cryptographyService');

// Magic operation
router.post('/magic', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = await cryptoService.magic(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Magic operation failed' });
  }
});

// URL encoding/decoding
router.post('/url/encode', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = await cryptoService.urlEncode(data);
    res.json({ encoded: result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'URL encoding failed' });
  }
});

router.post('/url/decode', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = await cryptoService.urlDecode(data);
    res.json({ decoded: result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'URL decoding failed' });
  }
});

// HTML encoding/decoding
router.post('/html/encode', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = await cryptoService.htmlEncode(data);
    res.json({ encoded: result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'HTML encoding failed' });
  }
});

router.post('/html/decode', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = await cryptoService.htmlDecode(data);
    res.json({ decoded: result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'HTML decoding failed' });
  }
});

// ROT13
router.post('/rot13', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = cryptoService.rot13(data);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'ROT13 operation failed' });
  }
});

// Binary to string
router.post('/binary/string', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = cryptoService.binaryToString(data);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Binary conversion failed' });
  }
});

// Unicode decode
router.post('/unicode/decode', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    const result = cryptoService.decodeUnicode(data);
    res.json({ decoded: result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unicode decoding failed' });
  }
});

// Existing routes
router.post('/analyze', authenticateToken, (req, res) => {
  try {
    const { data } = req.body;
    const result = cryptoService.analyzeData(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Cryptography analysis failed' });
  }
});

module.exports = router; 