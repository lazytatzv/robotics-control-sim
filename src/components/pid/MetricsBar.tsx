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
    <div className="telemetry-strip">
      <div className="telemetry-item">
        <span className="telemetry-title">RISE_TIME (tr)</span>
        <span className="telemetry-data">{metrics.riseTime}</span>
      </div>
      <div className="telemetry-item">
        <span className="telemetry-title">OVERSHOOT (Mp)</span>
        <span className="telemetry-data">{metrics.overshoot}</span>
      </div>
      <div className="telemetry-item">
        <span className="telemetry-title">SETTLING_TIME (ts)</span>
        <span className="telemetry-data">{metrics.settlingTime}</span>
      </div>
      <div className="telemetry-item">
        <span className="telemetry-title">STEADY_ERROR (ess)</span>
        <span className="telemetry-data">{metrics.steadyStateError}</span>
      </div>
    </div>
  );
};
