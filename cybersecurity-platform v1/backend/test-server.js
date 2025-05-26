const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint is working!' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin') {
    res.json({
      message: 'Login successful',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid username or password'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  res.status(201).json({
    message: 'Registration successful',
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: 2,
      username: username,
      role: 'user'
    }
  });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
}); 