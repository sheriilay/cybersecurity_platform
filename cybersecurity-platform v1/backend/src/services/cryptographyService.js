const crypto = require('crypto');
const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');
const { Buffer } = require('buffer');

class CryptographyService {
  constructor() {
    this.supportedAlgorithms = {
      symmetric: ['aes-256-cbc', 'aes-256-gcm', 'chacha20-poly1305'],
      asymmetric: ['rsa', 'ec'],
      hash: ['sha256', 'sha512', 'blake2b512'],
      encoding: ['base64', 'hex', 'utf8', 'ascii', 'binary', 'url-safe-base64']
    };
  }

  // Symmetric Encryption
  async encryptSymmetric(data, algorithm = 'aes-256-gcm', key = null) {
    try {
      const iv = randomBytes(16);
      const encryptionKey = key || randomBytes(32);
      
      const cipher = createCipheriv(algorithm, encryptionKey, iv);
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = algorithm.includes('gcm') ? cipher.getAuthTag() : null;
      
      return {
        encrypted,
        iv: iv.toString('base64'),
        key: encryptionKey.toString('base64'),
        authTag: authTag ? authTag.toString('base64') : null,
        algorithm
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  async decryptSymmetric(encryptedData, key, iv, algorithm = 'aes-256-gcm', authTag = null) {
    try {
      const decipher = createDecipheriv(
        algorithm,
        Buffer.from(key, 'base64'),
        Buffer.from(iv, 'base64')
      );
      
      if (authTag) {
        decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      }
      
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Hashing
  async hash(data, algorithm = 'sha256', salt = null) {
    try {
      const hash = crypto.createHash(algorithm);
      if (salt) {
        hash.update(salt);
      }
      hash.update(data);
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  async hmac(data, key, algorithm = 'sha256') {
    try {
      const hmac = crypto.createHmac(algorithm, key);
      hmac.update(data);
      return hmac.digest('hex');
    } catch (error) {
      throw new Error(`HMAC generation failed: ${error.message}`);
    }
  }

  // Encoding/Decoding
  encode(data, encoding = 'base64') {
    try {
      return Buffer.from(data).toString(encoding);
    } catch (error) {
      throw new Error(`Encoding failed: ${error.message}`);
    }
  }

  decode(data, encoding = 'base64') {
    try {
      return Buffer.from(data, encoding).toString('utf8');
    } catch (error) {
      throw new Error(`Decoding failed: ${error.message}`);
    }
  }

  // Key Generation
  generateKey(length = 32) {
    return randomBytes(length).toString('base64');
  }

  generateIV(length = 16) {
    return randomBytes(length).toString('base64');
  }

  // Password Hashing
  async hashPassword(password, saltRounds = 10) {
    try {
      const salt = randomBytes(16).toString('hex');
      const hash = await this.hash(password + salt, 'sha512');
      return {
        hash,
        salt
      };
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  async verifyPassword(password, hash, salt) {
    try {
      const computedHash = await this.hash(password + salt, 'sha512');
      return computedHash === hash;
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  // Data Analysis
  analyzeData(data) {
    try {
      const analysis = {
        entropy: this.calculateEntropy(data),
        encoding: this.detectEncoding(data),
        possibleFormats: this.detectPossibleFormats(data)
      };
      return analysis;
    } catch (error) {
      throw new Error(`Data analysis failed: ${error.message}`);
    }
  }

  calculateEntropy(data) {
    const frequencies = {};
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    const length = data.length;
    for (const char in frequencies) {
      const frequency = frequencies[char] / length;
      entropy -= frequency * Math.log2(frequency);
    }

    return entropy;
  }

  detectEncoding(data) {
    const encodings = ['utf8', 'ascii', 'base64', 'hex'];
    const results = {};

    for (const encoding of encodings) {
      try {
        const decoded = Buffer.from(data, encoding).toString('utf8');
        results[encoding] = this.calculateEntropy(decoded);
      } catch (error) {
        results[encoding] = -1;
      }
    }

    return Object.entries(results)
      .sort(([, a], [, b]) => b - a)
      .map(([encoding]) => encoding);
  }

  detectPossibleFormats(data) {
    const formats = [];
    
    // Check for common formats
    if (/^[A-Za-z0-9+/=]+$/.test(data)) {
      formats.push('base64');
    }
    if (/^[0-9A-Fa-f]+$/.test(data)) {
      formats.push('hex');
    }
    if (/^[a-zA-Z0-9\-_]+$/.test(data)) {
      formats.push('url-safe base64');
    }
    if (/^[a-zA-Z0-9\-_]+={0,2}$/.test(data)) {
      formats.push('base64url');
    }

    return formats;
  }

  // Utility Functions
  async generateRandomString(length = 32) {
    return randomBytes(length).toString('hex');
  }

  async generateSecureToken() {
    return randomBytes(32).toString('hex');
  }

  // Format Conversion
  convertFormat(data, fromFormat, toFormat) {
    try {
      const buffer = Buffer.from(data, fromFormat);
      return buffer.toString(toFormat);
    } catch (error) {
      throw new Error(`Format conversion failed: ${error.message}`);
    }
  }

  // Data Validation
  validateFormat(data, format) {
    try {
      switch (format) {
        case 'base64':
          return /^[A-Za-z0-9+/=]+$/.test(data);
        case 'hex':
          return /^[0-9A-Fa-f]+$/.test(data);
        case 'url-safe base64':
          return /^[a-zA-Z0-9\-_]+$/.test(data);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  // Magic Operations
  async magic(data) {
    try {
      const results = {
        possibleFormats: this.detectPossibleFormats(data),
        encoding: this.detectEncoding(data),
        entropy: this.calculateEntropy(data),
        transformations: await this.suggestTransformations(data),
        decodedResults: await this.tryDecode(data)
      };
      return results;
    } catch (error) {
      throw new Error(`Magic operation failed: ${error.message}`);
    }
  }

  async suggestTransformations(data) {
    const suggestions = [];
    const entropy = this.calculateEntropy(data);
    
    // Check for common patterns
    if (entropy > 4.5) {
      suggestions.push('This might be encrypted or compressed data');
    }
    
    if (/^[A-Za-z0-9+/=]+$/.test(data)) {
      suggestions.push('Try Base64 decode');
    }
    
    if (/^[0-9A-Fa-f]+$/.test(data)) {
      suggestions.push('Try Hex decode');
    }
    
    if (data.includes('%')) {
      suggestions.push('Try URL decode');
    }
    
    if (data.includes('\\u')) {
      suggestions.push('Try Unicode decode');
    }
    
    return suggestions;
  }

  async tryDecode(data) {
    const results = {};
    const decoders = [
      { name: 'base64', fn: () => this.decode(data, 'base64') },
      { name: 'hex', fn: () => this.decode(data, 'hex') },
      { name: 'url', fn: () => decodeURIComponent(data) },
      { name: 'unicode', fn: () => this.decodeUnicode(data) },
      { name: 'rot13', fn: () => this.rot13(data) },
      { name: 'binary', fn: () => this.binaryToString(data) }
    ];

    for (const decoder of decoders) {
      try {
        results[decoder.name] = decoder.fn();
      } catch (error) {
        results[decoder.name] = null;
      }
    }

    return results;
  }

  decodeUnicode(str) {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
      String.fromCharCode(parseInt(code, 16))
    );
  }

  rot13(str) {
    return str.replace(/[a-zA-Z]/g, char => {
      const code = char.charCodeAt(0);
      const base = code <= 90 ? 65 : 97;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    });
  }

  binaryToString(binary) {
    const bytes = binary.match(/.{1,8}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
  }

  // Additional encoding/decoding methods
  async urlEncode(str) {
    return encodeURIComponent(str);
  }

  async urlDecode(str) {
    return decodeURIComponent(str);
  }

  async htmlEncode(str) {
    return str.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  async htmlDecode(str) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    };
    return str.replace(/&(?:amp|lt|gt|quot|#39);/g, match => entities[match]);
  }
}

module.exports = new CryptographyService(); 