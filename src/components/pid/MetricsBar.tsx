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
    <div className="telemetry-bar">
      <div className="telemetry-cell">
        <span className="telemetry-label">Rise Time (tr)</span>
        <span className="telemetry-val">{metrics.riseTime}</span>
      </div>
      <div className="telemetry-cell">
        <span className="telemetry-label">Overshoot (Mp)</span>
        <span className="telemetry-val" style={{ color: metrics.overshoot !== '0.0 %' ? '#f59e0b' : '#f4f4f5' }}>
          {metrics.overshoot}
        </span>
      </div>
      <div className="telemetry-cell">
        <span className="telemetry-label">Settling Time (ts)</span>
        <span className="telemetry-val">{metrics.settlingTime}</span>
      </div>
      <div className="telemetry-cell">
        <span className="telemetry-label">Steady Error (ess)</span>
        <span className="telemetry-val">{metrics.steadyStateError}</span>
      </div>
    </div>
  );
};
