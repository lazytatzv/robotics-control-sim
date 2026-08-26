import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Simulator, StepDataPoint, BodeAnalysis, MotorSettings, MsdSettings, TunedGains } from '../../sim-bridge';
import { PidControls, PidControlState } from './PidControls';
import { MetricsBar, PerformanceMetrics } from './MetricsBar';
import { PlantCanvas } from './PlantCanvas';
import { ResponsePlot } from './ResponsePlot';
import { ControlPlot } from './ControlPlot';
import { BodePlot } from './BodePlot';

const INITIAL_MOTOR: MotorSettings = {
  j: 0.01,
  b: 0.1,
  kt: 0.05,
  ke: 0.05,
  r: 1.0,
  l: 0.005,
  coulomb_friction: 0.001,
  gear_ratio: 1.0,
};

const INITIAL_MSD: MsdSettings = {
  mass: 1.0,
  damping: 0.5,
  stiffness: 2.0,
  friction: 0.005,
};

const INITIAL_STATE: PidControlState = {
  plantType: 'motor_pos',
  controlMode: 'pid',
  kp: 15.0,
  ki: 2.0,
  kd: 1.8,
  filterN: 25,
  form: 'pi_d',
  antiWindup: 'clamping',
  saturation: 12.0,
  kb: 1.0,
  setpointWeightB: 1.0,
  setpointWeightC: 0.0,
  kvff: 0.0,
  kaff: 0.0,
  kFriction: 0.0,
  deadband: 0.0,

  cascade: {
    kpp: 20.0,
    kvp: 1.5,
    kvi: 15.0,
    max_velocity: 15.0,
    max_voltage: 12.0,
  },
  smc: {
    lambda: 15.0,
    k_switch: 8.0,
    boundary_epsilon: 0.1,
    k_eq: 0.5,
    max_voltage: 12.0,
  },
  notch: {
    omega_notch: 120.0,
    zeta_num: 0.05,
    zeta_den: 0.707,
    enabled: false,
  },
  trajectory: {
    max_vel: 10.0,
    max_acc: 30.0,
    max_jerk: 150.0,
    enabled: false,
  },

  motor: INITIAL_MOTOR,
  msd: INITIAL_MSD,

  target: 1.57,
  disturbance: 0.0,
  noise: 0.0,
  isPaused: false,
};

export const PidSimulator: React.FC = () => {
  const [controlState, setControlState] = useState<PidControlState>(INITIAL_STATE);
  const [scopeMode, setScopeMode] = useState<'time' | 'bode' | 'batch'>('time');
  const [baselineSnapshot, setBaselineSnapshot] = useState<StepDataPoint[] | null>(null);
  const [bodeAnalysis, setBodeAnalysis] = useState<BodeAnalysis | null>(null);

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    riseTime: '--',
    overshoot: '0.0 %',
    settlingTime: '--',
    steadyStateError: '0.000',
    phaseMargin: '--',
    gainMargin: '--',
    isStable: true,
  });

  const simRef = useRef<Simulator | null>(null);
  const historyRef = useRef<StepDataPoint[]>([]);
  const [lastDataPoint, setLastDataPoint] = useState<StepDataPoint | null>(null);
  const [historySnapshot, setHistorySnapshot] = useState<StepDataPoint[]>([]);

  // Initialize Rust Simulator
  useEffect(() => {
    const sim = new Simulator();
    simRef.current = sim;
  }, []);

  // Update Control Mode in WASM
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.set_control_mode(controlState.controlMode);
  }, [controlState.controlMode]);

  // Update PID & Feedforward configuration in WASM
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.configure_pid_advanced(
      controlState.kp,
      controlState.ki,
      controlState.kd,
      controlState.filterN,
      -controlState.saturation,
      controlState.saturation,
      controlState.antiWindup,
      controlState.form,
      controlState.kb,
      controlState.setpointWeightB,
      controlState.setpointWeightC,
      controlState.kvff,
      controlState.kaff,
      controlState.kFriction,
      controlState.deadband
    );
  }, [
    controlState.kp,
    controlState.ki,
    controlState.kd,
    controlState.filterN,
    controlState.saturation,
    controlState.antiWindup,
    controlState.form,
    controlState.kb,
    controlState.setpointWeightB,
    controlState.setpointWeightC,
    controlState.kvff,
    controlState.kaff,
    controlState.kFriction,
    controlState.deadband,
  ]);

  // Update Cascade Controller in WASM
  useEffect(() => {
    if (!simRef.current) return;
    const c = controlState.cascade;
    simRef.current.configure_cascade(
      c.kpp,
      c.kvp,
      c.kvi,
      c.max_velocity,
      controlState.saturation
    );
  }, [controlState.cascade, controlState.saturation]);

  // Update Sliding Mode Controller (SMC) in WASM
  useEffect(() => {
    if (!simRef.current) return;
    const s = controlState.smc;
    simRef.current.configure_smc(
      s.lambda,
      s.k_switch,
      s.boundary_epsilon,
      s.k_eq,
      controlState.saturation
    );
  }, [controlState.smc, controlState.saturation]);

  // Update Notch Filter in WASM
  useEffect(() => {
    if (!simRef.current) return;
    const n = controlState.notch;
    simRef.current.configure_notch(
      n.omega_notch,
      n.zeta_num,
      n.zeta_den,
      n.enabled
    );
  }, [controlState.notch]);

  // Update S-Curve Trajectory in WASM
  useEffect(() => {
    if (!simRef.current) return;
    const t = controlState.trajectory;
    simRef.current.configure_trajectory(
      t.max_vel,
      t.max_acc,
      t.max_jerk,
      t.enabled
    );
  }, [controlState.trajectory]);

  // Update Plant parameters (Motor & MSD) in WASM
  useEffect(() => {
    if (!simRef.current) return;
    const m = controlState.motor;
    simRef.current.configure_motor(
      m.j,
      m.b,
      m.kt,
      m.ke,
      m.r,
      m.l,
      m.coulomb_friction,
      m.gear_ratio
    );
    const msd = controlState.msd;
    simRef.current.configure_msd(
      msd.mass,
      msd.damping,
      msd.stiffness,
      msd.friction
    );
  }, [controlState.motor, controlState.msd]);

  // Switch Plant Type
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.set_plant_type(controlState.plantType);
    historyRef.current = [];
    setHistorySnapshot([]);
    setLastDataPoint(null);
  }, [controlState.plantType]);

  // Recompute Bode Stability Analysis whenever PID or Plant parameters change
  useEffect(() => {
    if (!simRef.current) return;
    try {
      const analysis = simRef.current.get_bode_analysis() as BodeAnalysis;
      setBodeAnalysis(analysis);
      setMetrics((prev) => ({
        ...prev,
        phaseMargin: analysis.phase_margin_deg !== undefined ? `${analysis.phase_margin_deg.toFixed(1)}°` : '--',
        gainMargin: analysis.gain_margin_db !== undefined ? `${analysis.gain_margin_db.toFixed(1)} dB` : '∞',
        isStable: analysis.is_stable,
      }));
    } catch (err) {
      console.error('Bode calculation error:', err);
    }
  }, [
    controlState.plantType,
    controlState.kp,
    controlState.ki,
    controlState.kd,
    controlState.filterN,
    controlState.motor,
    controlState.msd,
  ]);

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

  // Presets for Controller Tuning
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
            filterN: 35,
            form: 'pi_d',
            antiWindup: 'clamping',
            saturation: 12.0,
          };
        case 'oscillatory':
          return {
            ...prev,
            kp: 20.0,
            ki: 12.0,
            kd: 0.1,
            filterN: 15,
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

  // Presets for Real-World Industrial Motor Hardware
  const handleApplyMotorPreset = useCallback((preset: string) => {
    setControlState((prev) => {
      let motor: MotorSettings;
      switch (preset) {
        case 'drone_bldc':
          motor = {
            j: 0.0005,
            b: 0.001,
            kt: 0.02,
            ke: 0.02,
            r: 0.2,
            l: 0.0001,
            coulomb_friction: 0.0002,
            gear_ratio: 1.0,
          };
          break;
        case 'cnc_axis':
          motor = {
            j: 0.05,
            b: 0.2,
            kt: 0.25,
            ke: 0.25,
            r: 1.2,
            l: 0.008,
            coulomb_friction: 0.05,
            gear_ratio: 5.0,
          };
          break;
        case 'micro_servo':
          motor = {
            j: 0.001,
            b: 0.02,
            kt: 0.01,
            ke: 0.01,
            r: 4.5,
            l: 0.001,
            coulomb_friction: 0.01,
            gear_ratio: 50.0,
          };
          break;
        case 'heavy_joint':
          motor = {
            j: 0.25,
            b: 0.5,
            kt: 0.4,
            ke: 0.4,
            r: 1.5,
            l: 0.015,
            coulomb_friction: 0.08,
            gear_ratio: 50.0,
          };
          break;
        case 'industrial_servo':
        default:
          motor = {
            j: 0.02,
            b: 0.05,
            kt: 0.15,
            ke: 0.15,
            r: 0.8,
            l: 0.002,
            coulomb_friction: 0.005,
            gear_ratio: 10.0,
          };
          break;
      }
      return { ...prev, motor };
    });
  }, []);

  // 1-Click Auto-Tuning execution
  const handleAutoTune = useCallback((method: string) => {
    if (!simRef.current) return;
    try {
      const tuned = simRef.current.get_auto_tuned_gains(method) as TunedGains;
      setControlState((prev) => ({
        ...prev,
        kp: parseFloat(tuned.kp.toFixed(2)),
        ki: parseFloat(tuned.ki.toFixed(2)),
        kd: parseFloat(tuned.kd.toFixed(3)),
        filterN: parseFloat(tuned.filter_n.toFixed(0)),
      }));
    } catch (err) {
      console.error('Auto-tune error:', err);
    }
  }, []);

  // Ghost Snapshot Comparison (A/B Test)
  const handleCaptureSnapshot = useCallback(() => {
    setBaselineSnapshot([...historyRef.current]);
  }, []);

  const handleClearSnapshot = useCallback(() => {
    setBaselineSnapshot(null);
  }, []);

  // Export CSV Telemetry
  const handleExportCsv = useCallback(() => {
    const data = historyRef.current;
    if (data.length === 0) return;

    const headers = ['time_s', 'setpoint', 'actual', 'velocity', 'error', 'u_total', 'p_term', 'i_term', 'd_term', 'ff_term', 'current_A', 'saturated'];
    const rows = data.map((d) => [
      d.t.toFixed(4),
      d.setpoint.toFixed(4),
      d.actual.toFixed(4),
      d.velocity.toFixed(4),
      d.error.toFixed(4),
      d.u.toFixed(4),
      d.p_term.toFixed(4),
      d.i_term.toFixed(4),
      d.d_term.toFixed(4),
      d.ff_term?.toFixed(4) || '0.0',
      d.current.toFixed(4),
      d.is_saturated ? '1' : '0',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pid_simulation_${new Date().toISOString().slice(0, 19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Persistent step response tracking
  const stepTrackerRef = useRef<{
    stepId: number;
    stepStartTime: number;
    initialActual: number;
    initialTarget: number;
    currentTarget: number;
    stepDelta: number;
    maxOvershootPercent: number;
    peakActual: number;
    t10: number | null;
    t90: number | null;
    settlingTime: number | null;
  } | null>(null);

  const prevTargetRef = useRef<number>(INITIAL_STATE.target);

  // Step Response Analysis Engine
  const calculateMetrics = (data: StepDataPoint[]) => {
    if (data.length < 5) return;

    const latest = data[data.length - 1];
    const currentTarget = latest.setpoint;
    const latestActual = latest.actual;
    const steadyError = Math.abs(currentTarget - latestActual);

    // Detect new setpoint step transition
    const prevTarget = prevTargetRef.current;
    const targetDelta = Math.abs(currentTarget - prevTarget);

    if (targetDelta > 0.02) {
      // Step initiated
      const initialActual = data.length >= 2 ? data[data.length - 2].actual : latestActual;
      const stepDelta = currentTarget - initialActual;

      if (Math.abs(stepDelta) >= 0.03) {
        stepTrackerRef.current = {
          stepId: Date.now(),
          stepStartTime: latest.t,
          initialActual,
          initialTarget: prevTarget,
          currentTarget,
          stepDelta,
          maxOvershootPercent: 0.0,
          peakActual: initialActual,
          t10: null,
          t90: null,
          settlingTime: null,
        };
      }
      prevTargetRef.current = currentTarget;
    }

    // If tracker is not active, try to recover from buffer history
    if (!stepTrackerRef.current) {
      let stepStartIdx = 0;
      for (let i = data.length - 1; i > 0; i--) {
        if (Math.abs(data[i].setpoint - data[i - 1].setpoint) > 0.02) {
          stepStartIdx = i;
          break;
        }
      }

      const initialActual = stepStartIdx > 0 ? data[stepStartIdx - 1].actual : data[0].actual;
      const stepDelta = currentTarget - initialActual;
      if (Math.abs(stepDelta) >= 0.03) {
        stepTrackerRef.current = {
          stepId: Date.now(),
          stepStartTime: data[stepStartIdx].t,
          initialActual,
          initialTarget: data[0].setpoint,
          currentTarget,
          stepDelta,
          maxOvershootPercent: 0.0,
          peakActual: initialActual,
          t10: null,
          t90: null,
          settlingTime: null,
        };
      }
    }

    const tracker = stepTrackerRef.current;
    if (!tracker || Math.abs(tracker.stepDelta) < 0.03) {
      setMetrics((prev) => ({
        ...prev,
        steadyStateError: steadyError.toFixed(3),
      }));
      return;
    }

    // Scan data points belonging to the current active step transition
    const stepDelta = tracker.stepDelta;
    const r = tracker.currentTarget;

    // Update peak excursion and overshoot
    for (let i = data.length - 1; i >= 0; i--) {
      const d = data[i];
      if (d.t < tracker.stepStartTime) break;

      if (stepDelta > 0) {
        if (d.actual > tracker.peakActual) {
          tracker.peakActual = d.actual;
        }
        if (tracker.peakActual > r) {
          const os = ((tracker.peakActual - r) / Math.abs(stepDelta)) * 100;
          if (os > tracker.maxOvershootPercent) {
            tracker.maxOvershootPercent = os;
          }
        }
      } else {
        if (d.actual < tracker.peakActual) {
          tracker.peakActual = d.actual;
        }
        if (tracker.peakActual < r) {
          const os = ((r - tracker.peakActual) / Math.abs(stepDelta)) * 100;
          if (os > tracker.maxOvershootPercent) {
            tracker.maxOvershootPercent = os;
          }
        }
      }
    }

    // 10% to 90% Rise Time
    const y10 = tracker.initialActual + stepDelta * 0.1;
    const y90 = tracker.initialActual + stepDelta * 0.9;

    for (const d of data) {
      if (d.t < tracker.stepStartTime) continue;

      if (tracker.t10 === null) {
        if (stepDelta > 0 ? d.actual >= y10 : d.actual <= y10) {
          tracker.t10 = d.t;
        }
      }
      if (tracker.t90 === null) {
        if (stepDelta > 0 ? d.actual >= y90 : d.actual <= y90) {
          tracker.t90 = d.t;
        }
      }
    }

    const riseTimeStr =
      tracker.t10 !== null && tracker.t90 !== null && tracker.t90 >= tracker.t10
        ? `${(tracker.t90 - tracker.t10).toFixed(2)}s`
        : '--';

    // Settling Time (5% threshold of stepDelta)
    const threshold = Math.abs(stepDelta) * 0.05;
    let lastOutlierTime: number | null = null;

    for (const d of data) {
      if (d.t < tracker.stepStartTime) continue;
      if (Math.abs(d.actual - r) > threshold) {
        lastOutlierTime = d.t;
      }
    }

    const isCurrentlySettled = Math.abs(latestActual - r) <= threshold;
    const settlingTimeStr =
      isCurrentlySettled && lastOutlierTime !== null
        ? `${Math.max(0, lastOutlierTime - tracker.stepStartTime).toFixed(2)}s`
        : isCurrentlySettled
        ? '0.00s'
        : '--';

    setMetrics((prev) => ({
      ...prev,
      riseTime: riseTimeStr,
      overshoot: `${tracker.maxOvershootPercent.toFixed(1)} %`,
      settlingTime: settlingTimeStr,
      steadyStateError: steadyError.toFixed(3),
    }));
  };

  // Run Batch Simulation (0s to 5s Instant Step Response in Rust)
  const runBatchStep = useCallback(() => {
    if (!simRef.current) return;
    try {
      const batchData = simRef.current.run_batch(
        5.0,
        0.005,
        controlState.target,
        controlState.disturbance,
        2.5,
        controlState.noise
      ) as StepDataPoint[];
      historyRef.current = batchData;
      setHistorySnapshot(batchData);
      if (batchData.length > 0) {
        setLastDataPoint(batchData[batchData.length - 1]);
        calculateMetrics(batchData);
      }
    } catch (err) {
      console.error('Batch simulation error:', err);
    }
  }, [controlState.target, controlState.disturbance, controlState.noise]);

  // Execute batch simulation if batch mode is selected
  useEffect(() => {
    if (scopeMode === 'batch') {
      runBatchStep();
    }
  }, [scopeMode, runBatchStep]);

  // Real-time animation loop
  useEffect(() => {
    if (scopeMode === 'batch') return;

    let animId: number;
    let lastTime = performance.now();
    let lastMetricsTime = performance.now();
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
          lastPt = pt;
        }

        // Keep buffer bounded with O(1) amortized slice (avoiding shift in loop)
        if (historyRef.current.length > maxHistory + 40) {
          historyRef.current = historyRef.current.slice(-maxHistory);
        }

        if (lastPt) {
          setLastDataPoint(lastPt);
          setHistorySnapshot([...historyRef.current]);

          // Throttle complex metrics calculations to ~12Hz (every 80ms) to eliminate GC spikes
          if (currentTime - lastMetricsTime > 80) {
            calculateMetrics(historyRef.current);
            lastMetricsTime = currentTime;
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [controlState, scopeMode]);

  return (
    <main>
      <PidControls
        state={controlState}
        onChange={(updates) => setControlState((prev) => ({ ...prev, ...updates }))}
        onReset={handleReset}
        onStepInput={handleStepInput}
        onPulseDisturbance={handlePulseDisturbance}
        onApplyPreset={handleApplyPreset}
        onApplyMotorPreset={handleApplyMotorPreset}
        onAutoTune={handleAutoTune}
        scopeMode={scopeMode}
        onScopeModeChange={setScopeMode}
      />

      <section className="viewport-deck">
        <MetricsBar
          metrics={metrics}
          hasSnapshot={baselineSnapshot !== null}
          onCaptureSnapshot={handleCaptureSnapshot}
          onClearSnapshot={handleClearSnapshot}
          onExportCsv={handleExportCsv}
        />

        {scopeMode === 'time' && (
          <>
            <PlantCanvas
              data={lastDataPoint}
              plantType={controlState.plantType}
              onTargetChange={handleTargetChange}
            />
            <ResponsePlot history={historySnapshot} baselineHistory={baselineSnapshot} />
            <ControlPlot history={historySnapshot} baselineHistory={baselineSnapshot} />
          </>
        )}

        {scopeMode === 'bode' && (
          <>
            <BodePlot analysis={bodeAnalysis} />
            <ResponsePlot history={historySnapshot} baselineHistory={baselineSnapshot} />
          </>
        )}

        {scopeMode === 'batch' && (
          <>
            <div style={{ padding: '0.6rem 1.25rem', background: '#0a0a0a', borderBottom: '1px solid #262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#a1a1aa', fontWeight: 600, fontSize: '0.7rem' }}>
                5.0s HIGH-PRECISION BATCH STEP RESPONSE (RUST SIMULATED @ Δt = 5ms)
              </span>
              <button className="btn-mono btn-mono-invert" onClick={runBatchStep}>
                RE-CALCULATE BATCH
              </button>
            </div>
            <ResponsePlot history={historySnapshot} baselineHistory={baselineSnapshot} />
            <ControlPlot history={historySnapshot} baselineHistory={baselineSnapshot} />
          </>
        )}
      </section>
    </main>
  );
};
