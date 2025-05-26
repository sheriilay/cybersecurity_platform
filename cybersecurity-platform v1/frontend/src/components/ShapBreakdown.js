import React from 'react';

export default function ShapBreakdown({ explanation }) {
  return (
    <div className="shap-breakdown">
      <h3>SHAP Explanation</h3>
      <p>{explanation}</p>
    </div>
  );
}
