const xss = require('xss');
const { escape } = require('html-escaper');

function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove any potential script tags and escape HTML
    return escape(xss(input));
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

function sanitizePrompt(prompt) {
  // Remove any potential prompt injection attempts
  return prompt
    .replace(/system:|user:|assistant:/gi, '')
    .replace(/<|>|"|'|`/g, '')
    .trim();
}

function sanitizeResponse(response) {
  // Ensure response is properly formatted and sanitized
  if (typeof response === 'string') {
    return sanitizeInput(response);
  }
  
  if (typeof response === 'object' && response !== null) {
    try {
      // If response is JSON, parse and sanitize each field
      const sanitized = {};
      for (const [key, value] of Object.entries(response)) {
        sanitized[key] = sanitizeInput(value);
      }
      return sanitized;
    } catch (error) {
      console.error('Error sanitizing response:', error);
      return sanitizeInput(JSON.stringify(response));
    }
  }
  
  return response;
}

module.exports = {
  sanitizeInput,
  sanitizePrompt,
  sanitizeResponse
}; 