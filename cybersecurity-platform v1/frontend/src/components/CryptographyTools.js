import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import { getToken } from '../utils/auth';

function CryptographyTools() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [magicResults, setMagicResults] = useState(null);

  const handleMagic = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        API_ENDPOINTS.CRYPTO.MAGIC,
        { data: input },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setMagicResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Magic operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOperation = async (operation) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        API_ENDPOINTS.CRYPTO[operation.toUpperCase()],
        { data: input },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setOutput(res.data.encoded || res.data.decoded || res.data.result);
    } catch (err) {
      setError(err.response?.data?.error || `${operation} operation failed`);
    } finally {
      setLoading(false);
    }
  };

  const renderMagicResults = () => {
    if (!magicResults) return null;
    return (
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Magic Analysis Results" />
        <CardContent>
          <Typography variant="subtitle1">Possible Formats:</Typography>
          <Typography variant="body2" color="text.secondary">
            {magicResults.possibleFormats.join(', ')}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Detected Encoding:</Typography>
          <Typography variant="body2" color="text.secondary">
            {magicResults.encoding.join(', ')}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Entropy:</Typography>
          <Typography variant="body2" color="text.secondary">
            {magicResults.entropy.toFixed(2)}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Suggested Transformations:</Typography>
          <Typography variant="body2" color="text.secondary">
            {magicResults.transformations.join(', ')}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Decoded Results:</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(magicResults.decodedResults, null, 2)}
            </pre>
          </Paper>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Cryptography Tools</Typography>
      
      <TextField
        fullWidth
        label="Input Data"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        margin="normal"
        multiline
        rows={4}
      />

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Magic" />
        <Tab label="Encoding" />
        <Tab label="Decoding" />
        <Tab label="Transformation" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMagic}
            disabled={loading || !input}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze'}
          </Button>
          {renderMagicResults()}
        </Box>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOperation('url/encode')}
              disabled={loading || !input}
            >
              URL Encode
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOperation('html/encode')}
              disabled={loading || !input}
            >
              HTML Encode
            </Button>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOperation('url/decode')}
              disabled={loading || !input}
            >
              URL Decode
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOperation('html/decode')}
              disabled={loading || !input}
            >
              HTML Decode
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOperation('unicode/decode')}
              disabled={loading || !input}
            >
              Unicode Decode
            </Button>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOperation('rot13')}
              disabled={loading || !input}
            >
              ROT13
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOperation('binary/string')}
              disabled={loading || !input}
            >
              Binary to String
            </Button>
          </Grid>
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {output && (
        <Card sx={{ mt: 2 }}>
          <CardHeader title="Output" />
          <CardContent>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {output}
              </pre>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default CryptographyTools; 