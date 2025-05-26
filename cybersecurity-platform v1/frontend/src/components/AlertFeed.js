import React from 'react';

export default function AlertFeed({ alerts }) {
  return (
    <div className="alert-feed">
      <h3>Alerts</h3>
      <ul>
        {alerts.map((alert, idx) => (
          <li key={idx}>{alert.title || 'Alert'}</li>
        ))}
      </ul>
    </div>
  );
}
