const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const reverseService = require('../services/reverseEngineeringService');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const result = await reverseService.analyzeFile(req.file.path);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Reverse engineering failed' });
  }
});

module.exports = router; 