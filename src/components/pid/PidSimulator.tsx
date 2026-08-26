import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Simulator, StepDataPoint } from '../../sim-bridge';
import { PidControls, PidControlState } from './PidControls';
import { MetricsBar, PerformanceMetrics } from './MetricsBar';
import { PlantCanvas } from './PlantCanvas';
import { ResponsePlot } from './ResponsePlot';
import { ControlPlot } from './ControlPlot';

const INITIAL_STATE: PidControlState = {
  plantType: 'motor_pos',
  kp: 5.0,
  ki: 3.0,
  kd: 0.35,
  filterN: 10,
  form: 'standard',
  antiWindup: 'clamping',
  saturation: 12.0,
  target: 1.57,
  disturbance: 0.0,
  noise: 0.0,
  isPaused: false,
};

export const PidSimulator: React.FC = () => {
  const [controlState, setControlState] = useState<PidControlState>(INITIAL_STATE);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    riseTime: '--',
    overshoot: '0.0 %',
    settlingTime: '--',
    steadyStateError: '0.000',
  });

  const simRef = useRef<Simulator | null>(null);
  const historyRef = useRef<StepDataPoint[]>([]);
  const [lastDataPoint, setLastDataPoint] = useState<StepDataPoint | null>(null);
  const [historySnapshot, setHistorySnapshot] = useState<StepDataPoint[]>([]);

  // Initialize Wasm Simulator
  useEffect(() => {
    const sim = new Simulator();
    simRef.current = sim;
    return () => {
      // sim.free() handled automatically if needed
    };
  }, []);

  // Sync parameters with Rust Simulator
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.configure_pid(
      controlState.kp,
      controlState.ki,
      controlState.kd,
      controlState.filterN,
      -controlState.saturation,
      controlState.saturation,
      controlState.antiWindup,
      controlState.form,
      1.0
    );
  }, [controlState]);

  // Handle plant type change
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.set_plant_type(controlState.plantType);
    historyRef.current = [];
    setHistorySnapshot([]);
    setLastDataPoint(null);
  }, [controlState.plantType]);

  const handleReset = useCallback(() => {
    if (!simRef.current) return;
    simRef.current.reset();
    historyRef.current = [];
    setHistorySnapshot([]);
    setLastDataPoint(null);
  }, []);

  const handleStepInput = useCallback(() => {
    setControlState((prev) => ({
      ...prev,
      target: prev.target > 0 ? -1.57 : 1.57,
    }));
  }, []);

  const handlePulseDisturbance = useCallback(() => {
    setControlState((prev) => ({ ...prev, disturbance: 4.0 }));
    setTimeout(() => {
      setControlState((prev) => ({ ...prev, disturbance: 0.0 }));
    }, 400);
  }, []);

  const handleApplyPreset = useCallback((preset: string) => {
    setControlState((prev) => {
      switch (preset) {
        case 'tuned':
          return {
            ...prev,
            kp: 5.0,
            ki: 3.0,
            kd: 0.35,
            filterN: 10,
            form: 'standard',
            antiWindup: 'clamping',
            saturation: 12.0,
          };
        case 'oscillatory':
          return {
            ...prev,
            kp: 18.0,
            ki: 8.0,
            kd: 0.02,
            filterN: 10,
            form: 'standard',
            antiWindup: 'clamping',
          };
        case 'sluggish':
          return {
            ...prev,
            kp: 0.8,
            ki: 0.2,
            kd: 0.05,
            filterN: 10,
          };
        case 'windup_demo':
          return {
            ...prev,
            kp: 2.0,
            ki: 12.0,
            kd: 0.1,
            saturation: 3.0,
            antiWindup: 'none',
          };
        case 'ipd_demo':
          return {
            ...prev,
            kp: 5.0,
            ki: 3.0,
            kd: 0.35,
            form: 'i_pd',
          };
        default:
          return prev;
      }
    });
  }, []);

  // Compute performance metrics
  const calculateMetrics = (data: StepDataPoint[]) => {
    if (data.length < 20) return;
    const target = data[data.length - 1].setpoint;
    const initial = data[0].actual;
    const delta = target - initial;

    if (Math.abs(delta) < 1e-3) {
      setMetrics({
        riseTime: '--',
        overshoot: '0.0 %',
        settlingTime: '--',
        steadyStateError: Math.abs(target - data[data.length - 1].actual).toFixed(3),
      });
      return;
    }

    let peak = initial;
    for (const d of data) {
      if (delta > 0 && d.actual > peak) peak = d.actual;
      if (delta < 0 && d.actual < peak) peak = d.actual;
    }

    const overshoot = delta > 0 ? Math.max(0, (peak - target) / delta) * 100 : Math.max(0, (target - peak) / -delta) * 100;

    // 10% to 90% rise time
    const y10 = initial + delta * 0.1;
    const y90 = initial + delta * 0.9;
    let t10: number | null = null;
    let t90: number | null = null;

    for (const d of data) {
      if (t10 === null && (delta > 0 ? d.actual >= y10 : d.actual <= y10)) t10 = d.t;
      if (t90 === null && (delta > 0 ? d.actual >= y90 : d.actual <= y90)) t90 = d.t;
    }

    // 5% settling time
    let ts: number | null = null;
    for (let i = data.length - 1; i >= 0; i--) {
      if (Math.abs(data[i].actual - target) > Math.abs(delta) * 0.05) {
        ts = data[i].t;
        break;
      }
    }

    setMetrics({
      riseTime: t10 !== null && t90 !== null && t90 >= t10 ? `${(t90 - t10).toFixed(2)} s` : '--',
      overshoot: `${overshoot.toFixed(1)} %`,
      settlingTime: ts !== null ? `${ts.toFixed(2)} s` : '--',
      steadyStateError: Math.abs(target - data[data.length - 1].actual).toFixed(3),
    });
  };

  // 60FPS simulation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const simDt = 0.005; // 5ms step
    const maxHistory = 1000;

    const tick = (currentTime: number) => {
      const elapsedSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!controlState.isPaused && simRef.current) {
        const steps = Math.min(Math.round(elapsedSec / simDt), 10) || 1;
        let lastPt: StepDataPoint | null = null;

        for (let i = 0; i < steps; i++) {
          const pt = simRef.current.step(
            simDt,
            controlState.target,
            controlState.disturbance,
            controlState.noise
          ) as StepDataPoint;
          historyRef.current.push(pt);
          if (historyRef.current.length > maxHistory) {
            historyRef.current.shift();
          }
          lastPt = pt;
        }

        if (lastPt) {
          setLastDataPoint(lastPt);
          setHistorySnapshot([...historyRef.current]);
          calculateMetrics(historyRef.current);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [controlState]);

  return (
    <main>
      <PidControls
        state={controlState}
        onChange={(updates) => setControlState((prev) => ({ ...prev, ...updates }))}
        onReset={handleReset}
        onStepInput={handleStepInput}
        onPulseDisturbance={handlePulseDisturbance}
        onApplyPreset={handleApplyPreset}
      />

      <section className="viewport-grid">
        <MetricsBar metrics={metrics} />
        <PlantCanvas data={lastDataPoint} plantType={controlState.plantType} />
        <ResponsePlot history={historySnapshot} />
        <ControlPlot history={historySnapshot} />
      </section>
    </main>
  );
};
