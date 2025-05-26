const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { LoggingService } = require('./services/loggingService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const securityRoutes = require('./routes/securityRoutes');
const cryptoRoutes = require('./routes/cryptoRoutes');
const reverseRoutes = require('./routes/reverseRoutes');
const socRoutes = require('./routes/socRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.openai.com'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors(config.get('server.cors')));

// Rate limiting
const limiter = rateLimit(config.get('security.rateLimit'));
app.use(limiter);

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 100 * 1024, // Only compress responses larger than 100kb
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => LoggingService.info(message.trim())
  }
}));

// Request timing middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    LoggingService.performanceLog('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration.toFixed(2)}ms`
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/reverse', reverseRoutes);
app.use('/api/soc', socRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app; 