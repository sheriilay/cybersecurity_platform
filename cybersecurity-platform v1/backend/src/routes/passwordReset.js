const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const passwordResetService = require('../services/passwordResetService');
const { authenticateToken } = require('../middleware/auth');

// Validate password reset request
const validateResetRequest = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
];

// Validate password reset completion
const validateResetCompletion = [
  body('userId')
    .isNumeric()
    .withMessage('User ID is required'),
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
];

// Route to request a password reset
router.post('/request', validateResetRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array().map(err => ({ field: err.param, message: err.msg }))
      });
    }
    
    const { username, email } = req.body;
    const result = await passwordResetService.initiateReset(username, email);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      error: 'Password reset request failed',
      message: 'Unable to process password reset request'
    });
  }
});

// Route to complete a password reset
router.post('/complete', validateResetCompletion, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array().map(err => ({ field: err.param, message: err.msg }))
      });
    }
    
    const { userId, token, newPassword } = req.body;
    const result = await passwordResetService.completeReset(userId, token, newPassword);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Password reset completion error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'Unable to complete password reset'
    });
  }
});

// Admin route to force reset a user's password (requires admin authentication)
router.post('/admin/force-reset', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Admin privileges required'
      });
    }
    
    const { userId, temporaryPassword } = req.body;
    
    if (!userId || !temporaryPassword) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'User ID and temporary password are required'
      });
    }
    
    const result = await passwordResetService.adminForceReset(
      req.user.id, // Admin's user ID
      userId,      // Target user ID
      temporaryPassword
    );
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'Unable to reset user password'
    });
  }
});

module.exports = router; 