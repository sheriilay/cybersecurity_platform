import React from 'react';

export default function Heatmap({ data }) {
  return (
    <div className="heatmap">
      <h3>Heatmap Data</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
