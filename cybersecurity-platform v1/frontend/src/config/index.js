// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`
  },
  SECURITY: {
    SCAN: `${API_BASE_URL}/security/scan`,
    MONITOR: `${API_BASE_URL}/security/monitor`,
    MONITOR_STATUS: (id) => `${API_BASE_URL}/security/monitor/${id}`,
    LOGS: `${API_BASE_URL}/security/logs`
  },
  CRYPTO: {
    ANALYZE: '/api/crypto/analyze',
    MAGIC: '/api/crypto/magic',
    'URL/ENCODE': '/api/crypto/url/encode',
    'URL/DECODE': '/api/crypto/url/decode',
    'HTML/ENCODE': '/api/crypto/html/encode',
    'HTML/DECODE': '/api/crypto/html/decode',
    'UNICODE/DECODE': '/api/crypto/unicode/decode',
    'ROT13': '/api/crypto/rot13',
    'BINARY/STRING': '/api/crypto/binary/string'
  },
  REVERSE: {
    ANALYZE: `${API_BASE_URL}/reverse/analyze`
  },
  SOC: {
    LATEST: `${API_BASE_URL}/soc/latest`
  },
  COMPLIANCE: {
    CHECK: `${API_BASE_URL}/compliance/check`
  },
  AI: {
    ATTACK_SURFACE: `${API_BASE_URL}/ai/attack-surface`,
    COMPLIANCE: `${API_BASE_URL}/ai/compliance`,
    RISK_SCORE: `${API_BASE_URL}/ai/risk-score`,
    ANOMALIES: `${API_BASE_URL}/ai/anomalies`,
    METRICS: `${API_BASE_URL}/ai/metrics`
  }
};

// Theme Configuration
export const THEME = {
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2'
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828'
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100'
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b'
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500
    }
  }
};

// Security Configuration
export const SECURITY_CONFIG = {
  tokenExpiration: 3600, // 1 hour in seconds
  refreshTokenExpiration: 604800, // 7 days in seconds
  maxLoginAttempts: 5,
  lockoutDuration: 900, // 15 minutes in seconds
  passwordMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  requireUppercase: true
};

// Feature Flags
export const FEATURES = {
  enableAI: true,
  enableMonitoring: true,
  enableCompliance: true,
  enableSOC: true,
  enableReverseEngineering: true,
  enableCryptography: true
}; 