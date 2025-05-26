const dotenv = require('dotenv');
const path = require('path');
const { LoggingService } = require('../services/loggingService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configuration validation schemas
const validationSchemas = {
  port: (value) => {
    const port = parseInt(value, 10);
    return port >= 1 && port <= 65535;
  },
  boolean: (value) => ['true', 'false', '0', '1'].includes(value?.toLowerCase()),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  positiveNumber: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }
};

// Required environment variables with validation
const requiredEnvVars = {
  NODE_ENV: { type: 'string', values: ['development', 'production', 'test'] },
  PORT: { type: 'port' },
  DB_HOST: { type: 'string' },
  DB_PORT: { type: 'port' },
  DB_NAME: { type: 'string' },
  DB_USER: { type: 'string' },
  DB_PASSWORD: { 
    type: 'string', 
    minLength: process.env.NODE_ENV === 'production' ? 8 : 1 
  },
  JWT_SECRET: { type: 'string' },
  JWT_EXPIRES_IN: { type: 'string' },
  JWT_REFRESH_SECRET: { type: 'string' },
  JWT_REFRESH_SECRET_IN: { type: 'string' },
  GOOGLE_AI_API_KEY: { type: 'string' }
};

// Optional environment variables with validation
const optionalEnvVars = {
  FRONTEND_URL: { type: 'url' },
  DB_SSL: { type: 'boolean' },
  AI_MODEL: { type: 'string' },
  AI_MAX_TOKENS: { type: 'positiveNumber' },
  AI_TEMPERATURE: { type: 'number', min: 0, max: 1 },
  EMAIL_HOST: { type: 'string' },
  EMAIL_PORT: { type: 'port' },
  EMAIL_SECURE: { type: 'boolean' },
  EMAIL_USER: { type: 'email' },
  EMAIL_PASS: { type: 'string' }
};

// Validate environment variables
function validateEnvVars() {
  const errors = [];

  // Validate required variables
  Object.entries(requiredEnvVars).forEach(([key, schema]) => {
    const value = process.env[key];
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
      return;
    }

    if (schema.type === 'port' && !validationSchemas.port(value)) {
      errors.push(`Invalid port number for ${key}`);
    } else if (schema.type === 'boolean' && !validationSchemas.boolean(value)) {
      errors.push(`Invalid boolean value for ${key}`);
    } else if (schema.type === 'email' && !validationSchemas.email(value)) {
      errors.push(`Invalid email format for ${key}`);
    } else if (schema.type === 'url' && !validationSchemas.url(value)) {
      errors.push(`Invalid URL format for ${key}`);
    } else if (schema.type === 'positiveNumber' && !validationSchemas.positiveNumber(value)) {
      errors.push(`Invalid positive number for ${key}`);
    } else if (schema.values && !schema.values.includes(value)) {
      errors.push(`Invalid value for ${key}. Must be one of: ${schema.values.join(', ')}`);
    } else if (schema.minLength && value.length < schema.minLength) {
      errors.push(`${key} must be at least ${schema.minLength} characters long`);
    }
  });

  // Validate optional variables if they exist
  Object.entries(optionalEnvVars).forEach(([key, schema]) => {
    const value = process.env[key];
    if (!value) return;

    if (schema.type === 'port' && !validationSchemas.port(value)) {
      errors.push(`Invalid port number for ${key}`);
    } else if (schema.type === 'boolean' && !validationSchemas.boolean(value)) {
      errors.push(`Invalid boolean value for ${key}`);
    } else if (schema.type === 'email' && !validationSchemas.email(value)) {
      errors.push(`Invalid email format for ${key}`);
    } else if (schema.type === 'url' && !validationSchemas.url(value)) {
      errors.push(`Invalid URL format for ${key}`);
    } else if (schema.type === 'positiveNumber' && !validationSchemas.positiveNumber(value)) {
      errors.push(`Invalid positive number for ${key}`);
    }
  });

  return errors;
}

// Configuration object with caching
class Config {
  static #instance = null;
  static #config = null;

  static getInstance() {
    if (!this.#instance) {
      this.#instance = new Config();
    }
    return this.#instance;
  }

  constructor() {
    if (Config.#instance) {
      return Config.#instance;
    }

    const errors = validateEnvVars();
    if (errors.length > 0) {
      console.error('Configuration validation failed:', { errors });
      process.exit(1);
    }

    this.#loadConfig();
    Config.#instance = this;
  }

  #loadConfig() {
    Config.#config = {
      server: {
        port: parseInt(process.env.PORT, 10) || 3001,
        env: process.env.NODE_ENV,
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:3000',
          credentials: true
        }
      },
      database: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
        refreshTokenExpiresIn: process.env.JWT_REFRESH_SECRET_IN,
        saltRounds: 10
      },
      ai: {
        apiKey: process.env.GOOGLE_AI_API_KEY,
        model: process.env.AI_MODEL || 'gemini-pro',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 1000,
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7
      },
      security: {
        rateLimit: {
          windowMs: 15 * 60 * 1000,
          max: 100
        },
        passwordReset: {
          expiresIn: '1h'
        }
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxSize: 5242880,
        maxFiles: 5
      },
      email: {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    };
  }

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], Config.#config);
  }

  getAll() {
    return { ...Config.#config };
  }
}

// Export singleton instance
module.exports = Config.getInstance(); 