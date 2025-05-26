const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const LoggingService = require('./services/loggingService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const securityRoutes = require('./routes/security');
const passwordResetRoutes = require('./routes/passwordReset');
const cryptoRoutes = require('./routes/crypto');
const reverseRoutes = require('./routes/reverse');
const socRoutes = require('./routes/soc');
const complianceRoutes = require('./routes/compliance');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

app.use('/api/security', securityRoutes);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration
app.use(cors(config.get('server.cors')));

// Rate limiting
const limiter = rateLimit(config.get('security.rateLimit'));
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/reverse', reverseRoutes);
app.use('/api/soc', socRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.get('server.port');
const server = app.listen(PORT, () => {
  LoggingService.info(`Server running in ${config.get('server.env')} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  LoggingService.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    LoggingService.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  LoggingService.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    LoggingService.info('Server closed');
    process.exit(0);
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  LoggingService.error('Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  LoggingService.error('Unhandled Rejection:', { reason, promise });
  server.close(() => {
    process.exit(1);
  });
}); 

