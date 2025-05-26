const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Define log format with performance optimizations
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// Create daily rotate transport
const createDailyRotateTransport = (filename, level = 'info') => {
  return new winston.transports.DailyRotateFile({
    filename: path.join('logs', `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: logFormat
  });
};

// Create logger instance with optimized settings
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport with optimized format
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    }),
    // Rotating file transports
    createDailyRotateTransport('combined'),
    createDailyRotateTransport('error', 'error'),
    createDailyRotateTransport('security', 'info')
  ],
  // Performance optimization: handle uncaught exceptions
  exitOnError: false
});

// Logging service class with performance optimizations
class LoggingService {
  // Declare all private fields at class level
  static #logQueue = [];
  static #isProcessing = false;
  static #batchSize = 10;
  static #flushInterval = 5000; // 5 seconds
  static #flushTimer = null;

  static #processQueue() {
    if (this.#isProcessing || this.#logQueue.length === 0) return;

    this.#isProcessing = true;
    const batch = this.#logQueue.splice(0, this.#batchSize);

    try {
      batch.forEach(({ level, message, meta }) => {
        logger.log(level, message, meta);
      });
    } catch (error) {
      console.error('Error processing log queue:', error);
    } finally {
      this.#isProcessing = false;
      if (this.#logQueue.length > 0) {
        setTimeout(() => this.#processQueue(), 0);
      }
    }
  }

  static #scheduleFlush() {
    if (!this.#flushTimer) {
      this.#flushTimer = setInterval(() => {
        if (this.#logQueue.length > 0) {
          this.#processQueue();
        }
      }, this.#flushInterval);
    }
  }

  static log(level, message, meta = {}) {
    this.#logQueue.push({ level, message, meta });
    this.#scheduleFlush();
    this.#processQueue();
  }

  static error(message, meta = {}) {
    this.log('error', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  static info(message, meta = {}) {
    this.log('info', message, meta);
  }

  static debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Optimized security logging with batching
  static securityLog(action, details = {}) {
    this.log('info', 'Security Event', {
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Optimized audit logging with batching
  static auditLog(user, action, resource, details = {}) {
    this.log('info', 'Audit Event', {
      user: user.id || 'anonymous',
      action,
      resource,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Optimized performance logging with batching
  static performanceLog(operation, duration, details = {}) {
    this.log('info', 'Performance Metric', {
      operation,
      duration,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup method for graceful shutdown
  static async shutdown() {
    if (this.#flushTimer) {
      clearInterval(this.#flushTimer);
    }
    if (this.#logQueue.length > 0) {
      await new Promise(resolve => {
        this.#processQueue();
        setTimeout(resolve, 1000); // Wait for queue to process
      });
    }
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

module.exports = LoggingService; 