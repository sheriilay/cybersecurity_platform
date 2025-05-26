const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('../../config/ai.config');
const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');
const rateLimit = require('express-rate-limit');
const { validateInput } = require('../utils/validation');
const { sanitizeInput } = require('../utils/sanitization');

class AIService {
  constructor() {
    this.validateConfig();
    this.initializeAI();
    this.initializeCache();
    this.initializeRateLimiter();
    this.initializeThreatPatterns();
    this.initializeMetrics();
  }

  validateConfig() {
    if (!aiConfig.googleAI?.apiKey) {
      throw new Error('Google AI API key is required');
    }
    if (!aiConfig.googleAI?.model) {
      throw new Error('AI model configuration is required');
    }
    if (!aiConfig.aiSettings?.cacheDuration) {
      throw new Error('Cache duration configuration is required');
    }
  }

  initializeAI() {
    try {
      this.genAI = new GoogleGenerativeAI(aiConfig.googleAI.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: aiConfig.googleAI.model,
        generationConfig: {
          maxOutputTokens: aiConfig.googleAI.maxTokens || 2048,
          temperature: aiConfig.googleAI.temperature || 0.7,
          topP: aiConfig.googleAI.topP || 0.8,
          topK: aiConfig.googleAI.topK || 40
        },
        safetySettings: aiConfig.googleAI.safetySettings || [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      });
      this.isEnabled = true;
      this.threatPatterns = new Map();
    } catch (error) {
      console.error('Failed to initialize Google AI:', error);
      this.isEnabled = false;
      throw new Error('AI service initialization failed');
    }
  }

  initializeCache() {
    this.cache = new NodeCache({ 
      stdTTL: aiConfig.aiSettings.cacheDuration,
      checkperiod: 120,
      useClones: false
    });
  }

  initializeRateLimiter() {
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later'
    });
  }

  initializeThreatPatterns() {
    // Initialize common threat patterns for quick reference
    this.threatPatterns.set('sql_injection', [
      'UNION SELECT',
      'OR 1=1',
      'DROP TABLE',
      '--',
      ';--',
      '/*',
      '*/'
    ]);

    this.threatPatterns.set('xss', [
      '<script>',
      'javascript:',
      'onerror=',
      'onload=',
      'eval(',
      'document.cookie'
    ]);

    this.threatPatterns.set('command_injection', [
      ';',
      '|',
      '&',
      '>',
      '<',
      '`',
      '$'
    ]);
  }

  initializeMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }

  async analyzeSecurityData(data, context) {
    try {
      // Validate and sanitize input
      const sanitizedData = sanitizeInput(data);
      const sanitizedContext = sanitizeInput(context);
      
      if (!validateInput(sanitizedData) || !validateInput(sanitizedContext)) {
        throw new Error('Invalid input data');
      }

      // Check cache
      const cacheKey = `security_analysis_${JSON.stringify(sanitizedData)}_${sanitizedContext}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      if (!this.isEnabled) {
        return this.getMockAnalysis(sanitizedData, sanitizedContext);
      }

      const startTime = performance.now();
      
      const prompt = this.buildSecurityAnalysisPrompt(sanitizedData, sanitizedContext);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      const endTime = performance.now();
      this.updateMetrics(endTime - startTime, true);

      // Cache the result
      this.cache.set(cacheKey, response.text());
      
      return response.text();
    } catch (error) {
      console.error('AI analysis error:', error);
      this.updateMetrics(0, false);
      return this.getMockAnalysis(data, context);
    }
  }

  buildSecurityAnalysisPrompt(data, context) {
    return `Analyze the following security data and provide a detailed assessment:
      Context: ${context}
      Data: ${JSON.stringify(data, null, 2)}
      
      Please provide:
      1. Risk assessment
      2. Potential vulnerabilities
      3. Security recommendations
      4. Severity level (critical, high, medium, low)
      5. Likelihood of exploitation
      6. Impact assessment
      7. Mitigation strategies
      
      Format the response in a structured JSON format with the following keys:
      {
        "risk_assessment": string,
        "vulnerabilities": array,
        "recommendations": array,
        "severity": string,
        "likelihood": string,
        "impact": string,
        "mitigation": array
      }`;
  }

  async predictThreats(historicalData, currentData) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableThreatPrediction) {
      return this.getMockThreatPrediction(historicalData, currentData);
    }

    try {
      const prompt = `Based on the following historical and current security data, predict potential future threats:
        Historical Data: ${JSON.stringify(historicalData, null, 2)}
        Current Data: ${JSON.stringify(currentData, null, 2)}
        
        Please provide:
        1. Predicted threat types
        2. Likelihood of occurrence
        3. Potential impact
        4. Recommended preventive measures
        5. Timeline prediction
        6. Confidence level`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Threat prediction error:', error);
      return this.getMockThreatPrediction(historicalData, currentData);
    }
  }

  async analyzeVulnerabilityPattern(pattern, type) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableVulnerabilityAnalysis) {
      return this.getMockVulnerabilityAnalysis(pattern, type);
    }

    try {
      const prompt = `Analyze this security pattern and provide detailed insights:
        Pattern Type: ${type}
        Pattern: ${pattern}
        
        Please provide:
        1. Pattern analysis
        2. Potential impact
        3. Common exploitation methods
        4. Detection techniques
        5. Prevention strategies`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return this.getMockVulnerabilityAnalysis(pattern, type);
    }
  }

  async generateSecurityReport(scanResults) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableSecurityReporting) {
      return this.getMockSecurityReport(scanResults);
    }

    try {
      const prompt = `Generate a comprehensive security report based on these scan results:
        ${JSON.stringify(scanResults, null, 2)}
        
        Please provide:
        1. Executive summary
        2. Detailed findings
        3. Risk assessment
        4. Recommendations
        5. Action items
        6. Priority levels
        7. Timeline for remediation`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Report generation error:', error);
      return this.getMockSecurityReport(scanResults);
    }
  }

  async analyzeBehavioralPatterns(userActivity) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableBehavioralAnalysis) {
      return this.getMockBehavioralAnalysis(userActivity);
    }

    try {
      const prompt = `Analyze these user activity patterns for potential security concerns:
        ${JSON.stringify(userActivity, null, 2)}
        
        Please provide:
        1. Anomaly detection
        2. Risk assessment
        3. Behavioral patterns
        4. Security implications
        5. Recommended actions`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Behavioral analysis error:', error);
      return this.getMockBehavioralAnalysis(userActivity);
    }
  }

  getThreatPatterns(type) {
    return this.threatPatterns.get(type) || [];
  }

  // Mock responses for when AI is disabled or fails
  getMockAnalysis(data, context) {
    return `Mock Analysis for ${context}:
      - Basic risk assessment
      - Standard security recommendations
      - Severity: Medium
      - Impact: Moderate
      - Recommendation: Implement standard security measures`;
  }

  getMockThreatPrediction(historicalData, currentData) {
    return `Mock Threat Prediction:
      - Common web vulnerabilities
      - Medium likelihood
      - Standard preventive measures recommended
      - Timeline: Next 30 days
      - Confidence: Medium`;
  }

  getMockVulnerabilityAnalysis(pattern, type) {
    return `Mock Vulnerability Analysis for ${type}:
      - Standard pattern analysis
      - Common impact assessment
      - Basic prevention strategies
      - Standard detection methods`;
  }

  getMockSecurityReport(scanResults) {
    return `Mock Security Report:
      - Basic findings summary
      - Standard recommendations
      - Priority: Medium
      - Timeline: 2-4 weeks`;
  }

  getMockBehavioralAnalysis(userActivity) {
    return `Mock Behavioral Analysis:
      - Standard pattern detection
      - Basic risk assessment
      - Common security implications
      - Standard recommendations`;
  }

  async analyzeAttackSurface(target) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableAttackSurfaceAnalysis) {
      return this.getMockAttackSurfaceAnalysis(target);
    }

    try {
      const startTime = performance.now();
      const prompt = `Analyze the attack surface of the following target:
        Target: ${JSON.stringify(target, null, 2)}
        
        Please provide:
        1. Attack vectors
        2. Entry points
        3. Potential vulnerabilities
        4. Security controls
        5. Risk assessment
        6. Hardening recommendations`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      this.updateMetrics(performance.now() - startTime, true);
      return response.text();
    } catch (error) {
      console.error('Attack surface analysis error:', error);
      this.updateMetrics(0, false);
      return this.getMockAttackSurfaceAnalysis(target);
    }
  }

  async analyzeCompliance(data, framework) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableComplianceAnalysis) {
      return this.getMockComplianceAnalysis(data, framework);
    }

    try {
      const startTime = performance.now();
      const prompt = `Analyze compliance with ${framework} for the following data:
        Data: ${JSON.stringify(data, null, 2)}
        
        Please provide:
        1. Compliance status
        2. Violations
        3. Required controls
        4. Remediation steps
        5. Documentation requirements
        6. Risk assessment`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      this.updateMetrics(performance.now() - startTime, true);
      return response.text();
    } catch (error) {
      console.error('Compliance analysis error:', error);
      this.updateMetrics(0, false);
      return this.getMockComplianceAnalysis(data, framework);
    }
  }

  async calculateRiskScore(data) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableRiskScoring) {
      return this.getMockRiskScore(data);
    }

    try {
      const startTime = performance.now();
      const weights = aiConfig.riskScoring.weights;
      const thresholds = aiConfig.riskScoring.thresholds;

      const prompt = `Calculate a comprehensive risk score based on the following data:
        Data: ${JSON.stringify(data, null, 2)}
        
        Consider these weights:
        - Vulnerability Severity: ${weights.vulnerabilitySeverity}
        - Threat Intelligence: ${weights.threatIntelligence}
        - Compliance Violations: ${weights.complianceViolations}
        - Historical Data: ${weights.historicalData}
        - Asset Value: ${weights.assetValue}
        
        Use these thresholds:
        - Critical: ${thresholds.critical}
        - High: ${thresholds.high}
        - Medium: ${thresholds.medium}
        - Low: ${thresholds.low}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      this.updateMetrics(performance.now() - startTime, true);
      return response.text();
    } catch (error) {
      console.error('Risk scoring error:', error);
      this.updateMetrics(0, false);
      return this.getMockRiskScore(data);
    }
  }

  async detectAnomalies(data, context) {
    if (!this.isEnabled || !aiConfig.aiSettings.enableAnomalyDetection) {
      return this.getMockAnomalyDetection(data, context);
    }

    try {
      const startTime = performance.now();
      const prompt = `Detect anomalies in the following data:
        Context: ${context}
        Data: ${JSON.stringify(data, null, 2)}
        
        Please provide:
        1. Anomaly detection results
        2. Severity assessment
        3. Potential causes
        4. Impact analysis
        5. Recommended actions
        6. False positive probability`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      this.updateMetrics(performance.now() - startTime, true);
      return response.text();
    } catch (error) {
      console.error('Anomaly detection error:', error);
      this.updateMetrics(0, false);
      return this.getMockAnomalyDetection(data, context);
    }
  }

  updateMetrics(responseTime, success) {
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.totalResponseTime += responseTime;
      this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.successfulRequests;
    } else {
      this.metrics.failedRequests++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
    };
  }

  // Mock responses for new features
  getMockAttackSurfaceAnalysis(target) {
    return `Mock Attack Surface Analysis for ${target}:
      - Basic attack vectors identified
      - Standard entry points mapped
      - Common vulnerabilities listed
      - Basic security controls reviewed
      - Standard risk assessment
      - General hardening recommendations`;
  }

  getMockComplianceAnalysis(data, framework) {
    return `Mock Compliance Analysis for ${framework}:
      - Basic compliance status
      - Common violations listed
      - Standard controls required
      - General remediation steps
      - Basic documentation needs
      - Standard risk assessment`;
  }

  getMockRiskScore(data) {
    return `Mock Risk Score Analysis:
      - Overall risk score: 0.65
      - Risk level: High
      - Contributing factors listed
      - Standard mitigation recommendations
      - Basic risk breakdown
      - General improvement suggestions`;
  }

  getMockAnomalyDetection(data, context) {
    return `Mock Anomaly Detection Results:
      - Basic anomalies identified
      - Standard severity assessment
      - Common causes listed
      - General impact analysis
      - Basic action recommendations
      - Standard false positive assessment`;
  }

  async batchProcess(dataArray, processor) {
    const batchSize = aiConfig.aiSettings.batchSize || 10;
    const results = [];
    
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
      
      // Add delay between batches to prevent rate limiting
      if (i + batchSize < dataArray.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

module.exports = new AIService(); 