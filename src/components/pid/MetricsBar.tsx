import React from 'react';

export interface PerformanceMetrics {
  riseTime: string;
  overshoot: string;
  settlingTime: string;
  steadyStateError: string;
  phaseMargin?: string;
  gainMargin?: string;
  peakEffort?: string;
  isStable?: boolean;
}

interface MetricsBarProps {
  metrics: PerformanceMetrics;
  hasSnapshot: boolean;
  onCaptureSnapshot: () => void;
  onClearSnapshot: () => void;
  onExportCsv: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = React.memo(({
  metrics,
  hasSnapshot,
  onCaptureSnapshot,
  onClearSnapshot,
  onExportCsv,
}) => {
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
      <div className="telemetry-item">
        <span className="telemetry-title">STABILITY (PM / GM)</span>
        <span className="telemetry-data" style={{ fontSize: '0.8rem', color: metrics.isStable ? '#22c55e' : '#ef4444' }}>
          {metrics.phaseMargin ? `${metrics.phaseMargin} / ${metrics.gainMargin || '∞'}` : '--'}
        </span>
      </div>
      <div className="telemetry-actions">
        <button
          className={`btn-action-mini ${hasSnapshot ? 'active' : ''}`}
          onClick={hasSnapshot ? onClearSnapshot : onCaptureSnapshot}
          title="Ghost trace comparison overlay"
        >
          {hasSnapshot ? 'CLEAR A/B' : 'CAPTURE A/B'}
        </button>
        <button className="btn-action-mini" onClick={onExportCsv} title="Download CSV for MATLAB / Python">
          EXPORT CSV
        </button>
      </div>
    </div>
  );
});

MetricsBar.displayName = 'MetricsBar';
