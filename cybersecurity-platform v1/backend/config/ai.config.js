require('dotenv').config();

module.exports = {
  googleAI: {
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    model: 'gemini-pro',
    maxTokens: 1000,
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  },
  aiSettings: {
    enableThreatPrediction: true,
    enableBehavioralAnalysis: true,
    enableVulnerabilityAnalysis: true,
    enableSecurityReporting: true,
    enableAnomalyDetection: true,
    enableAttackSurfaceAnalysis: true,
    enableComplianceAnalysis: true,
    enableRiskScoring: true,
    confidenceThreshold: 0.85,
    analysisDepth: 'detailed', // basic, standard, detailed
    responseTimeLimit: 5000, // ms
    maxRetries: 3,
    cacheEnabled: true,
    cacheDuration: 3600, // seconds
    batchProcessing: {
      enabled: true,
      maxBatchSize: 10,
      processingInterval: 5000 // ms
    },
    monitoring: {
      enabled: true,
      logLevel: 'info',
      metricsCollection: true
    }
  },
  complianceFrameworks: {
    enabled: ['ISO27001', 'NIST', 'GDPR', 'PCI-DSS'],
    customRules: []
  },
  riskScoring: {
    weights: {
      vulnerabilitySeverity: 0.3,
      threatIntelligence: 0.2,
      complianceViolations: 0.2,
      historicalData: 0.15,
      assetValue: 0.15
    },
    thresholds: {
      critical: 0.8,
      high: 0.6,
      medium: 0.4,
      low: 0.2
    }
  }
}; 