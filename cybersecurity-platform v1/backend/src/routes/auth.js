const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const router = express.Router();
const { authenticateToken, generateTokens, refreshAccessToken } = require('../middleware/auth');

// Input validation middleware
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
];

// User registration
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array().map(err => ({ field: err.param, message: err.msg }))
      });
    }

    const { username, email, password, role } = req.body;
    let client;
    try {
      client = await pool.connect();
    } catch (err) {
      console.error('DB connection error (register):', err.message);
      return res.status(500).json({ error: 'Database connection failed', message: err.message });
    }

    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Registration failed',
          message: 'Username or email already exists'
        });
      }

      // Hash password and create user
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      } catch (err) {
        console.error('Bcrypt error:', err.message);
        return res.status(500).json({ error: 'Password hashing failed', message: err.message });
      }
      
      const result = await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
        [username, email, hashedPassword, role]
      );

      const user = result.rows[0];
      const tokens = generateTokens(user);

      res.status(201).json({
        message: 'Registration successful',
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Registration failed', message: err.message });
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message || 'An error occurred during registration'
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { username, password } = req.body;
    let client;
    try {
      client = await pool.connect();
    } catch (err) {
      console.error('DB connection error (login):', err.message);
      return res.status(500).json({ error: 'Database connection failed', message: err.message });
    }

    try {
      // First, try to check if the user exists without fetching the password
      const userCheck = await client.query(
        'SELECT id, username, role FROM users WHERE username = $1',
        [username]
      );

      if (userCheck.rows.length === 0) {
        console.log('No user found for username:', username);
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid username or password'
        });
      }

      // User exists, now try to fetch the password for verification
      const passwordResult = await client.query(
        'SELECT password FROM users WHERE username = $1',
        [username]
      );

      // Password extraction error handling
      if (!passwordResult.rows[0] || !passwordResult.rows[0].password) {
        console.error('Password field missing or corrupted for user:', username);
        
        // Log the issue in security_logs
        await client.query(
          'INSERT INTO security_logs (user_id, action, details) VALUES ($1, $2, $3)',
          [userCheck.rows[0].id, 'login', JSON.stringify({
            error: 'password_extraction_failed',
            message: 'Password field missing or corrupted'
          })]
        );
        
        return res.status(500).json({
          error: 'Authentication error',
          message: 'Account verification failed. Please contact support.'
        });
      }

      const storedPassword = passwordResult.rows[0].password;
      let validPassword = false;

      try {
        validPassword = await bcrypt.compare(password, storedPassword);
        console.log('Password comparison result:', validPassword);
      } catch (err) {
        console.error('Bcrypt compare error:', err.message);
        
        // Log the bcrypt error
        await client.query(
          'INSERT INTO security_logs (user_id, action, details) VALUES ($1, $2, $3)',
          [userCheck.rows[0].id, 'login', JSON.stringify({
            error: 'password_verification_failed',
            message: err.message
          })]
        );
        
        return res.status(500).json({ 
          error: 'Password verification failed', 
          message: 'Account verification failed. Please contact support.' 
        });
      }

      if (!validPassword) {
        console.log('Password did not match for user:', username);
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid username or password'
        });
      }

      const user = userCheck.rows[0]; // Use the user details from the first query
      let tokens;
      try {
        tokens = generateTokens(user);
      } catch (err) {
        console.error('JWT error:', err.message);
        return res.status(500).json({ error: 'Token generation failed', message: err.message });
      }

      res.json({
        message: 'Login successful',
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login DB error:', err.message);
      return res.status(500).json({ error: 'Login failed', message: err.message });
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message || 'An error occurred during login'
    });
  }
});

// Token refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh failed',
        message: 'No refresh token provided'
      });
    }

    const tokens = await refreshAccessToken(refreshToken);
    res.json({
      message: 'Token refresh successful',
      ...tokens
    });
  } catch (error) {
    res.status(401).json({
      error: 'Refresh failed',
      message: 'Invalid refresh token'
    });
  }
});

module.exports = router; 