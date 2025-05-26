const { expect } = require('chai');
const aiService = require('../src/services/aiService');

describe('AI Service', () => {
  describe('Security Data Analysis', () => {
    it('should analyze security data', async () => {
      const testData = {
        vulnerabilities: [
          { type: 'XSS', severity: 'high' },
          { type: 'SQL Injection', severity: 'critical' }
        ]
      };
      const result = await aiService.analyzeSecurityData(testData, 'Test Analysis');
      expect(result).to.be.a('string');
      expect(result.length).to.be.greaterThan(0);
    });
  });

  describe('Threat Prediction', () => {
    it('should predict threats based on historical data', async () => {
      const historicalData = [
        { timestamp: '2024-01-01', vulnerabilities: [] },
        { timestamp: '2024-01-02', vulnerabilities: [{ type: 'XSS' }] }
      ];
      const currentData = { vulnerabilities: [{ type: 'SQL Injection' }] };
      const result = await aiService.predictThreats(historicalData, currentData);
      expect(result).to.be.a('string');
      expect(result.length).to.be.greaterThan(0);
    });
  });

  describe('Vulnerability Pattern Analysis', () => {
    it('should analyze vulnerability patterns', async () => {
      const pattern = '<script>alert(1)</script>';
      const result = await aiService.analyzeVulnerabilityPattern(pattern, 'XSS');
      expect(result).to.be.a('string');
      expect(result.length).to.be.greaterThan(0);
    });
  });

  describe('Security Report Generation', () => {
    it('should generate security reports', async () => {
      const scanResults = {
        summary: { score: 85, totalIssues: 3 },
        details: { vulnerabilities: [] }
      };
      const result = await aiService.generateSecurityReport(scanResults);
      expect(result).to.be.a('string');
      expect(result.length).to.be.greaterThan(0);
    });
  });
}); 