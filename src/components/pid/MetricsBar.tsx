import React from 'react';

export interface PerformanceMetrics {
  riseTime: string;
  overshoot: string;
  settlingTime: string;
  steadyStateError: string;
}

interface MetricsBarProps {
  metrics: PerformanceMetrics;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics }) => {
  return (
    <div className="metrics-bar card">
      <div className="metric-box">
        <div className="metric-label">Rise Time (tr)</div>
        <div className="metric-val">{metrics.riseTime}</div>
      </div>
      <div className="metric-box">
        <div className="metric-label">Overshoot (Mp)</div>
        <div className="metric-val">{metrics.overshoot}</div>
      </div>
      <div className="metric-box">
        <div className="metric-label">Settling Time (ts 5%)</div>
        <div className="metric-val">{metrics.settlingTime}</div>
      </div>
      <div className="metric-box">
        <div className="metric-label">Steady-State Error (ess)</div>
        <div className="metric-val">{metrics.steadyStateError}</div>
      </div>
    </div>
  );
};
