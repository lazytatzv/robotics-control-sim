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
        <div className="metric-label">立ち上がり時間 (tr)</div>
        <div className="metric-val">{metrics.riseTime}</div>
      </div>
      <div className="metric-box">
        <div className="metric-label">オーバーシュート (Mp)</div>
        <div className="metric-val">{metrics.overshoot}</div>
      </div>
      <div className="metric-box">
        <div className="metric-label">整定時間 (ts 5%)</div>
        <div className="metric-val">{metrics.settlingTime}</div>
      </div>
      <div className="metric-box">
        <div className="metric-label">定常偏差 (ess)</div>
        <div className="metric-val">{metrics.steadyStateError}</div>
      </div>
    </div>
  );
};
