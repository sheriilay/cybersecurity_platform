const createAlert = async (alertData) => {
    // Store in TheHive
    await axios.post(`${THEHIVE_URL}/alert`, {
      type: 'cyber-threat',
      source: 'AI Detection',
      title: alertData.title,
      description: buildAlertDescription(alertData),
      tags: ['auto-generated', alertData.riskLevel],
      artifacts: [
        { data: alertData.sourceIp, dataType: 'ip' },
        { data: alertData.geo.country, dataType: 'country' }
      ]
    });
  
    // Share with MISP
    await axios.post(`${MISP_URL}/events`, {
      Event: {
        info: `AI Detected Threat: ${alertData.title}`,
        threat_level_id: getMISPThreatLevel(alertData.score),
        analysis: '1', // Initial
        distribution: '1',
        Attribute: [
          { type: 'ip-src', value: alertData.sourceIp },
          { type: 'comment', value: alertData.explanation }
        ]
      }
    });
  };