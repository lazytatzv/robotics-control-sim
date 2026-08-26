import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Simulator, StepDataPoint } from '../../sim-bridge';
import { PidControls, PidControlState } from './PidControls';
import { MetricsBar, PerformanceMetrics } from './MetricsBar';
import { PlantCanvas } from './PlantCanvas';
import { ResponsePlot } from './ResponsePlot';
import { ControlPlot } from './ControlPlot';

const INITIAL_STATE: PidControlState = {
  plantType: 'motor_pos',
  kp: 15.0,
  ki: 2.0,
  kd: 1.8,
  filterN: 25,
  form: 'pi_d',
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

  useEffect(() => {
    const sim = new Simulator();
    simRef.current = sim;
  }, []);

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

  const handleTargetChange = useCallback((newTarget: number) => {
    setControlState((prev) => ({ ...prev, target: newTarget }));
  }, []);

  const handleApplyPreset = useCallback((preset: string) => {
    setControlState((prev) => {
      switch (preset) {
        case 'tuned':
          return {
            ...prev,
            kp: 15.0,
            ki: 2.0,
            kd: 1.8,
            filterN: 25,
            form: 'pi_d',
            antiWindup: 'clamping',
            saturation: 12.0,
          };
        case 'fast':
          return {
            ...prev,
            kp: 25.0,
            ki: 4.0,
            kd: 2.5,
            filterN: 30,
            form: 'pi_d',
            antiWindup: 'clamping',
            saturation: 12.0,
          };
        case 'oscillatory':
          return {
            ...prev,
            kp: 20.0,
            ki: 10.0,
            kd: 0.1,
            filterN: 10,
            form: 'standard',
            antiWindup: 'clamping',
          };
        case 'sluggish':
          return {
            ...prev,
            kp: 2.0,
            ki: 0.5,
            kd: 0.8,
            filterN: 10,
            form: 'standard',
          };
        case 'windup_demo':
          return {
            ...prev,
            kp: 5.0,
            ki: 15.0,
            kd: 0.2,
            saturation: 3.0,
            antiWindup: 'none',
          };
        default:
          return prev;
      }
    });
  }, []);

  // Correct step response analysis based on the latest step transition
  const calculateMetrics = (data: StepDataPoint[]) => {
    if (data.length < 20) return;

    const currentTarget = data[data.length - 1].setpoint;
    const latestActual = data[data.length - 1].actual;
    const steadyError = Math.abs(currentTarget - latestActual);

    // 1. Detect the most recent setpoint step change
    let stepStartIdx = 0;
    for (let i = data.length - 1; i > 0; i--) {
      if (Math.abs(data[i].setpoint - data[i - 1].setpoint) > 0.02) {
        stepStartIdx = i;
        break;
      }
    }

    // Initial state before this step occurred
    const initialActual = stepStartIdx > 0 ? data[stepStartIdx - 1].actual : data[0].actual;
    const stepDelta = currentTarget - initialActual;
    const stepStartTime = data[stepStartIdx].t;

    // If change was negligible, only report steady error
    if (Math.abs(stepDelta) < 0.05) {
      setMetrics({
        riseTime: '--',
        overshoot: '0.0 %',
        settlingTime: '--',
        steadyStateError: steadyError.toFixed(3),
      });
      return;
    }

    // 2. Search for Peak value during this step transition
    const stepSlice = data.slice(stepStartIdx);
    let peakActual = initialActual;

    if (stepDelta > 0) {
      for (const d of stepSlice) {
        if (d.actual > peakActual) peakActual = d.actual;
      }
    } else {
      for (const d of stepSlice) {
        if (d.actual < peakActual) peakActual = d.actual;
      }
    }

    // Calculate Overshoot (%)
    let overshootPercent = 0;
    if (stepDelta > 0 && peakActual > currentTarget) {
      overshootPercent = ((peakActual - currentTarget) / stepDelta) * 100;
    } else if (stepDelta < 0 && peakActual < currentTarget) {
      overshootPercent = ((currentTarget - peakActual) / Math.abs(stepDelta)) * 100;
    }

    // 3. 10% to 90% Rise Time
    const y10 = initialActual + stepDelta * 0.1;
    const y90 = initialActual + stepDelta * 0.9;
    let t10: number | null = null;
    let t90: number | null = null;

    for (const d of stepSlice) {
      if (t10 === null && (stepDelta > 0 ? d.actual >= y10 : d.actual <= y10)) {
        t10 = d.t;
      }
      if (t90 === null && (stepDelta > 0 ? d.actual >= y90 : d.actual <= y90)) {
        t90 = d.t;
      }
    }

    const riseTimeStr = t10 !== null && t90 !== null && t90 >= t10 ? `${(t90 - t10).toFixed(2)}s` : '--';

    // 4. Settling Time (5% threshold of stepDelta)
    const threshold = Math.abs(stepDelta) * 0.05;
    let lastOutlierTime: number | null = null;

    for (const d of stepSlice) {
      if (Math.abs(d.actual - currentTarget) > threshold) {
        lastOutlierTime = d.t;
      }
    }

    // Settling time is only valid if it currently stays inside the threshold
    const isCurrentlySettled = Math.abs(latestActual - currentTarget) <= threshold;
    const settlingTimeStr =
      isCurrentlySettled && lastOutlierTime !== null
        ? `${Math.max(0, lastOutlierTime - stepStartTime).toFixed(2)}s`
        : isCurrentlySettled
        ? '0.00s'
        : '--';

    setMetrics({
      riseTime: riseTimeStr,
      overshoot: `${overshootPercent.toFixed(1)} %`,
      settlingTime: settlingTimeStr,
      steadyStateError: steadyError.toFixed(3),
    });
  };

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const simDt = 0.005;
    const maxHistory = 800;

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

      <section className="viewport-deck">
        <MetricsBar metrics={metrics} />
        <PlantCanvas
          data={lastDataPoint}
          plantType={controlState.plantType}
          onTargetChange={handleTargetChange}
        />
        <ResponsePlot history={historySnapshot} />
        <ControlPlot history={historySnapshot} />
      </section>
    </main>
  );
};
