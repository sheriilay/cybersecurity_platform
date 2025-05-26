import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent, CardHeader, Button, Box, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Tabs, Tab, TextField, Input, InputLabel
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import { getToken, removeToken } from '../utils/auth';
import CryptographyTools from '../components/CryptographyTools';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [tab, setTab] = useState(0);

  // Scan state
  const [scanUrl, setScanUrl] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  // Monitoring state
  const [monitorUrl, setMonitorUrl] = useState('');
  const [monitoring, setMonitoring] = useState(false);
  const [monitorResult, setMonitorResult] = useState(null);
  const [monitorError, setMonitorError] = useState('');
  const [monitorInterval, setMonitorInterval] = useState(null);

  // Reverse Engineering state
  const [reverseFile, setReverseFile] = useState(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseResult, setReverseResult] = useState(null);
  const [reverseError, setReverseError] = useState('');

  // SOC state
  const [socLoading, setSocLoading] = useState(false);
  const [socResult, setSocResult] = useState(null);
  const [socError, setSocError] = useState('');

  // Compliance state
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceResult, setComplianceResult] = useState(null);
  const [complianceError, setComplianceError] = useState('');

  // AI Analysis state
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [selectedFramework, setSelectedFramework] = useState('ISO27001');
  const [aiMetrics, setAiMetrics] = useState(null);

  // User info
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    try {
      const userObj = JSON.parse(userStr);
      setUser(userObj);
    } catch {
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  // Admin logs
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLogsLoading(true);
    axios.get(API_ENDPOINTS.SECURITY.LOGS, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(res => {
        setLogs(res.data.logs || []);
        setLogsLoading(false);
      })
      .catch(() => {
        setLogsError('Failed to load security logs');
        setLogsLoading(false);
      });
  }, [user]);

  // Logout
  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Scan
  const handleScan = async () => {
    setScanLoading(true);
    setScanError('');
    setScanResult(null);
    try {
      const res = await axios.post(API_ENDPOINTS.SECURITY.SCAN, 
        { url: scanUrl }, 
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setScanResult(res.data);
      await handleAiAnalysis('attack-surface', scanUrl);
    } catch (err) {
      setScanError(err.response?.data?.error || 'Scan failed.');
    } finally {
      setScanLoading(false);
    }
  };

  // Monitoring
  const startMonitoring = async () => {
    setMonitorError(''); setMonitorResult(null);
    setMonitoring(true);
    try {
      const res = await axios.post(API_ENDPOINTS.SECURITY.MONITOR, { url: monitorUrl }, { headers: { Authorization: `Bearer ${getToken()}` } });
      pollMonitor(res.data.monitoringId);
      const interval = setInterval(() => pollMonitor(res.data.monitoringId), 5000);
      setMonitorInterval(interval);
    } catch (err) {
      setMonitorError(err.response?.data?.error || 'Failed to start monitoring.');
      setMonitoring(false);
    }
  };
  const stopMonitoring = () => {
    if (monitorInterval) clearInterval(monitorInterval);
    setMonitorInterval(null); setMonitoring(false); setMonitorResult(null);
  };
  const pollMonitor = async (id) => {
    try {
      const res = await axios.get(API_ENDPOINTS.SECURITY.MONITOR_STATUS(id), {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setMonitorResult(res.data);
      
      // Perform AI analysis for anomaly detection
      await handleAiAnalysis('anomalies', res.data);
    } catch (err) {
      setMonitorError('Failed to get monitoring results.');
      setMonitoring(false);
    }
  };

  // Reverse Engineering
  const handleReverse = async () => {
    if (!reverseFile) { setReverseError('Please select a file.'); return; }
    setReverseLoading(true); setReverseError(''); setReverseResult(null);
    const formData = new FormData();
    formData.append('file', reverseFile);
    try {
      const res = await axios.post(API_ENDPOINTS.REVERSE.ANALYZE, formData, { headers: { Authorization: `Bearer ${getToken()}`,'Content-Type': 'multipart/form-data' } });
      setReverseResult(res.data);
    } catch (err) {
      setReverseError(err.response?.data?.error || 'Reverse engineering failed.');
    } finally {
      setReverseLoading(false);
    }
  };

  // SOC
  const handleSoc = async () => {
    setSocLoading(true); setSocError(''); setSocResult(null);
    try {
      const res = await axios.get(API_ENDPOINTS.SOC.LATEST, { headers: { Authorization: `Bearer ${getToken()}` } });
      setSocResult(res.data);
    } catch (err) {
      setSocError(err.response?.data?.error || 'Failed to load SOC events.');
    } finally {
      setSocLoading(false);
    }
  };

  // Compliance
  const handleCompliance = async () => {
    setComplianceLoading(true);
    setComplianceError('');
    setComplianceResult(null);
    try {
      const res = await axios.get(API_ENDPOINTS.COMPLIANCE.CHECK, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setComplianceResult(res.data);
      
      // Perform AI analysis on compliance results
      await handleAiAnalysis('compliance', res.data);
    } catch (err) {
      setComplianceError(err.response?.data?.error || 'Compliance check failed.');
    } finally {
      setComplianceLoading(false);
    }
  };

  // AI Analysis
  const handleAiAnalysis = async (type, data) => {
    setAiAnalysisLoading(true);
    setAiAnalysisError('');
    setAiAnalysisResult(null);
    try {
      let endpoint;
      let payload = {};

      switch (type) {
        case 'attack-surface':
          endpoint = API_ENDPOINTS.AI.ATTACK_SURFACE;
          payload = { target: data };
          break;
        case 'compliance':
          endpoint = API_ENDPOINTS.AI.COMPLIANCE;
          payload = { data, framework: selectedFramework };
          break;
        case 'risk-score':
          endpoint = API_ENDPOINTS.AI.RISK_SCORE;
          payload = { data };
          break;
        case 'anomalies':
          endpoint = API_ENDPOINTS.AI.ANOMALIES;
          payload = { data, context: 'security-monitoring' };
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      const res = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setAiAnalysisResult(res.data);
    } catch (err) {
      setAiAnalysisError(err.response?.data?.error || 'AI analysis failed.');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Get AI Metrics
  const fetchAiMetrics = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.AI.METRICS, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setAiMetrics(res.data);
    } catch (err) {
      console.error('Failed to fetch AI metrics:', err);
    }
  };

  // Tab content
  const renderTab = () => {
    switch (tab) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader avatar={<SecurityIcon color="primary" />} title="User Info" />
                <CardContent>
                  <Typography variant="body1"><b>Username:</b> {user.username}</Typography>
                  <Typography variant="body1"><b>Role:</b> {user.role}</Typography>
                  {user.last_login && (
                    <Typography variant="body1"><b>Last Login:</b> {new Date(user.last_login).toLocaleString()}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader avatar={<CheckCircleIcon color="success" />} title="System Health" />
                <CardContent>
                  <Typography variant="body1">All systems are operating normally.</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader avatar={<WarningIcon color="warning" />} title="Active Threats" />
                <CardContent>
                  <Typography variant="body1">No active threats detected.</Typography>
                </CardContent>
              </Card>
            </Grid>
            {user.role === 'admin' && (
              <Grid item xs={12} mt={3}>
                <Typography variant="h5" gutterBottom>Recent Security Logs</Typography>
                {logsLoading ? <CircularProgress /> : logsError ? <Alert severity="error">{logsError}</Alert> : (
                  <Card><List>{logs.length === 0 && <ListItem><ListItemText primary="No logs found." /></ListItem>}{logs.map((log, idx) => (<React.Fragment key={log.id || idx}><ListItem><ListItemText primary={`${log.action} (${log.created_at ? new Date(log.created_at).toLocaleString() : ''})`} secondary={log.details ? JSON.stringify(log.details) : ''} /></ListItem>{idx < logs.length - 1 && <Divider />}</React.Fragment>))}</List></Card>
                )}
              </Grid>
            )}
          </Grid>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Security Scan</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Website URL" value={scanUrl} onChange={e => setScanUrl(e.target.value)} margin="normal" />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button variant="contained" color="primary" onClick={handleScan} disabled={scanLoading || !scanUrl}>
                  {scanLoading ? <CircularProgress size={24} /> : 'Start Scan'}
                </Button>
              </Grid>
            </Grid>
            {scanError && <Alert severity="error" sx={{ mt: 2 }}>{scanError}</Alert>}
            {scanResult && (
              <Box sx={{ mt: 4 }}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Scan Summary" />
                  <CardContent>
                    <Typography variant="body1"><b>Score:</b> {scanResult.summary?.score ?? 'N/A'}</Typography>
                    <Typography variant="body1"><b>Total Issues:</b> {scanResult.summary?.totalIssues ?? 'N/A'}</Typography>
                    <Typography variant="body1"><b>Critical:</b> {scanResult.summary?.criticalIssues ?? 0} | <b>High:</b> {scanResult.summary?.highIssues ?? 0} | <b>Medium:</b> {scanResult.summary?.mediumIssues ?? 0} | <b>Low:</b> {scanResult.summary?.lowIssues ?? 0}</Typography>
                  </CardContent>
                </Card>
                <Grid container spacing={2}>
                  {scanResult.details?.dns && (
                    <Grid item xs={12} md={6}><Card><CardHeader title="DNS Info" /><CardContent><pre>{JSON.stringify(scanResult.details.dns, null, 2)}</pre></CardContent></Card></Grid>
                  )}
                  {scanResult.details?.whois && (
                    <Grid item xs={12} md={6}><Card><CardHeader title="WHOIS Info" /><CardContent><pre>{JSON.stringify(scanResult.details.whois, null, 2)}</pre></CardContent></Card></Grid>
                  )}
                  {scanResult.details?.ssl && (
                    <Grid item xs={12} md={6}><Card><CardHeader title="SSL Info" /><CardContent><pre>{JSON.stringify(scanResult.details.ssl, null, 2)}</pre></CardContent></Card></Grid>
                  )}
                  {scanResult.details?.headers && (
                    <Grid item xs={12} md={6}><Card><CardHeader title="Security Headers" /><CardContent><pre>{JSON.stringify(scanResult.details.headers, null, 2)}</pre></CardContent></Card></Grid>
                  )}
                  {scanResult.details?.ports && (
                    <Grid item xs={12} md={6}><Card><CardHeader title="Open Ports" /><CardContent><pre>{JSON.stringify(scanResult.details.ports, null, 2)}</pre></CardContent></Card></Grid>
                  )}
                  {scanResult.details?.vulnerabilities && (
                    <Grid item xs={12} md={12}><Card><CardHeader title="Vulnerabilities" /><CardContent><pre>{JSON.stringify(scanResult.details.vulnerabilities, null, 2)}</pre></CardContent></Card></Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Threat Monitoring</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}><TextField fullWidth label="Website URL" value={monitorUrl} onChange={e => setMonitorUrl(e.target.value)} margin="normal" /></Grid>
              <Grid item xs={12} md={2}><Button variant="contained" color="primary" onClick={startMonitoring} disabled={monitoring || !monitorUrl}>{monitoring ? <CircularProgress size={24} /> : 'Start Monitoring'}</Button></Grid>
              <Grid item xs={12} md={2}><Button variant="outlined" color="secondary" onClick={stopMonitoring} disabled={!monitoring}>Stop Monitoring</Button></Grid>
            </Grid>
            {monitorError && <Alert severity="error" sx={{ mt: 2 }}>{monitorError}</Alert>}
            {monitoring && (!monitorResult || monitorResult.status === 'running') && (
              <Alert severity="info" sx={{ mt: 2 }}>Monitoring in progress... (scans every 5 seconds, 3 times)</Alert>
            )}
            {monitorResult && monitorResult.status === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>{monitorResult.error || 'Monitoring failed.'}</Alert>
            )}
            {monitorResult && monitorResult.history && monitorResult.history.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Monitoring History</Typography>
                <Grid container spacing={2}>
                  {monitorResult.history.map((scan, idx) => (
                    <Grid item xs={12} md={6} key={scan.timestamp}>
                      <Card>
                        <CardHeader title={`Scan #${idx + 1} (${new Date(scan.timestamp).toLocaleTimeString()})`} />
                        <CardContent>
                          <Typography variant="body2"><b>Score:</b> {scan.summary?.score ?? 'N/A'}</Typography>
                          <Typography variant="body2"><b>Total Issues:</b> {scan.summary?.totalIssues ?? 'N/A'}</Typography>
                          <Typography variant="body2"><b>Critical:</b> {scan.summary?.criticalIssues ?? 0} | <b>High:</b> {scan.summary?.highIssues ?? 0} | <b>Medium:</b> {scan.summary?.mediumIssues ?? 0} | <b>Low:</b> {scan.summary?.lowIssues ?? 0}</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}><b>Threats:</b></Typography>
                          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12 }}>{JSON.stringify(scan.threats, null, 2)}</pre>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        );
      case 3:
        return <CryptographyTools />;
      case 4:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Reverse Engineering</Typography>
            <InputLabel htmlFor="reverse-file">Upload File</InputLabel>
            <Input id="reverse-file" type="file" onChange={e => setReverseFile(e.target.files[0])} />
            <Button variant="contained" color="primary" onClick={handleReverse} disabled={reverseLoading || !reverseFile} sx={{ mt: 2 }}>{reverseLoading ? <CircularProgress size={24} /> : 'Analyze File'}</Button>
            {reverseError && <Alert severity="error" sx={{ mt: 2 }}>{reverseError}</Alert>}
            {reverseResult && <Card sx={{ mt: 4 }}><CardHeader title="Reverse Engineering Results" /><CardContent><pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(reverseResult, null, 2)}</pre></CardContent></Card>}
          </Box>
        );
      case 5:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>SOC Events</Typography>
            <Button variant="contained" color="primary" onClick={handleSoc} disabled={socLoading} sx={{ mb: 2 }}>{socLoading ? <CircularProgress size={24} /> : 'Load SOC Events'}</Button>
            {socError && <Alert severity="error" sx={{ mt: 2 }}>{socError}</Alert>}
            {socResult && <Card sx={{ mt: 2 }}><CardHeader title="SOC Events" /><CardContent><pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(socResult, null, 2)}</pre></CardContent></Card>}
          </Box>
        );
      case 6:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Compliance Check</Typography>
            <Button variant="contained" color="primary" onClick={handleCompliance} disabled={complianceLoading} sx={{ mb: 2 }}>{complianceLoading ? <CircularProgress size={24} /> : 'Run Compliance Check'}</Button>
            {complianceError && <Alert severity="error" sx={{ mt: 2 }}>{complianceError}</Alert>}
            {complianceResult && <Card sx={{ mt: 2 }}><CardHeader title="Compliance Results" /><CardContent><pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(complianceResult, null, 2)}</pre></CardContent></Card>}
          </Box>
        );
      default:
        return null;
    }
  };

  // Add new AI tab
  const renderAiTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>AI-Powered Security Analysis</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              avatar={<PsychologyIcon color="primary" />} 
              title="AI Analysis" 
            />
            <CardContent>
              <Typography variant="body1" gutterBottom color="text.secondary">
                Select analysis type and provide data for AI-powered security assessment.
              </Typography>
              <TextField
                select
                fullWidth
                label="Analysis Type"
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                margin="normal"
                SelectProps={{ native: true }}
              >
                <option value="ISO27001">ISO27001</option>
                <option value="NIST">NIST</option>
                <option value="GDPR">GDPR</option>
                <option value="PCI-DSS">PCI-DSS</option>
              </TextField>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleAiAnalysis('compliance', complianceResult)}
                disabled={aiAnalysisLoading || !complianceResult}
                sx={{ mt: 2 }}
              >
                {aiAnalysisLoading ? <CircularProgress size={24} /> : 'Run AI Analysis'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              avatar={<AssessmentIcon color="primary" />} 
              title="AI Performance Metrics" 
            />
            <CardContent>
              {aiMetrics ? (
                <>
                  <Typography variant="body1" color="text.secondary">
                    <b>Total Requests:</b> {aiMetrics.totalRequests}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    <b>Success Rate:</b> {aiMetrics.successRate.toFixed(2)}%
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    <b>Average Response Time:</b> {aiMetrics.averageResponseTime.toFixed(2)}ms
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">No metrics available</Typography>
              )}
              <Button
                variant="outlined"
                color="primary"
                onClick={fetchAiMetrics}
                sx={{ mt: 2 }}
              >
                Refresh Metrics
              </Button>
            </CardContent>
          </Card>
        </Grid>
        {aiAnalysisError && (
          <Grid item xs={12}>
            <Alert severity="error">{aiAnalysisError}</Alert>
          </Grid>
        )}
        {aiAnalysisResult && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="AI Analysis Results" />
              <CardContent>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all',
                  backgroundColor: 'background.paper',
                  padding: '16px',
                  borderRadius: '4px'
                }}>
                  {JSON.stringify(aiAnalysisResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">Security Dashboard</Typography>
        <Button variant="outlined" color="secondary" startIcon={<LogoutIcon />} onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Scan" />
        <Tab label="Monitoring" />
        <Tab label="Cryptography" />
        <Tab label="Reverse" />
        <Tab label="SOC" />
        <Tab label="Compliance" />
        <Tab label="AI Analysis" />
      </Tabs>
      {tab === 7 ? renderAiTab() : renderTab()}
    </Container>
  );
}

export default Dashboard; 