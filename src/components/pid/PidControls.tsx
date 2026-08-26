import React, { useState } from 'react';
import { CascadeSettings, MotorSettings, MsdSettings, NotchSettings, SmcSettings, TrajectorySettings } from '../../sim-bridge';

export interface PidControlState {
  plantType: 'motor_pos' | 'motor_velocity' | 'cart';
  controlMode: 'pid' | 'cascade' | 'smc';

  // Standard PID
  kp: number;
  ki: number;
  kd: number;
  filterN: number;
  form: 'standard' | 'pi_d' | 'i_pd' | '2dof';
  antiWindup: 'clamping' | 'back_calc' | 'none';
  saturation: number;
  kb: number;
  setpointWeightB: number;
  setpointWeightC: number;
  kvff: number;
  kaff: number;
  kFriction: number;
  deadband: number;

  // Advanced Controllers
  cascade: CascadeSettings;
  smc: SmcSettings;
  notch: NotchSettings;
  trajectory: TrajectorySettings;
  
  // Physical parameters
  motor: MotorSettings;
  msd: MsdSettings;

  // Signal & testing
  target: number;
  disturbance: number;
  noise: number;
  isPaused: boolean;
}

interface PidControlsProps {
  state: PidControlState;
  onChange: (updates: Partial<PidControlState>) => void;
  onReset: () => void;
  onStepInput: () => void;
  onPulseDisturbance: () => void;
  onApplyPreset: (preset: string) => void;
  onApplyMotorPreset: (preset: string) => void;
  onAutoTune: (method: string) => void;
  scopeMode: 'time' | 'bode' | 'batch';
  onScopeModeChange: (mode: 'time' | 'bode' | 'batch') => void;
}

export const PidControls: React.FC<PidControlsProps> = React.memo(({
  state,
  onChange,
  onReset,
  onStepInput,
  onPulseDisturbance,
  onApplyPreset,
  onApplyMotorPreset,
  onAutoTune,
  scopeMode,
  onScopeModeChange,
}) => {
  const [activeSection, setActiveSection] = useState<'controller' | 'plant' | 'autotune' | 'filters' | 'signals'>('controller');

  return (
    <aside className="sidebar">
      {/* Scope Mode Selector */}
      <div className="control-block">
        <div className="block-header">VIEW // SCOPE ANALYSIS MODE</div>
        <div className="button-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <button
            className={`btn-mono ${scopeMode === 'time' ? 'active' : ''}`}
            onClick={() => onScopeModeChange('time')}
          >
            TIME SCOPE
          </button>
          <button
            className={`btn-mono ${scopeMode === 'bode' ? 'active' : ''}`}
            onClick={() => onScopeModeChange('bode')}
          >
            BODE PLOT
          </button>
          <button
            className={`btn-mono ${scopeMode === 'batch' ? 'active' : ''}`}
            onClick={() => onScopeModeChange('batch')}
          >
            5S BATCH
          </button>
        </div>
      </div>

      {/* Always Visible Quick Test & Excitation */}
      <div className="control-block" style={{ borderBottom: '1px solid #27272a' }}>
        <div className="block-header">EXCITATION & TEST ACTIONS</div>
        <div className="button-grid">
          <button className="btn-mono btn-mono-invert" onClick={onStepInput}>
            STEP INVERT
          </button>
          <button className="btn-mono" onClick={onPulseDisturbance}>
            PULSE LOAD
          </button>
        </div>
        <div className="button-grid">
          <button className="btn-mono" onClick={onReset}>
            RESET
          </button>
          <button
            className={`btn-mono ${state.isPaused ? 'active' : ''}`}
            onClick={() => onChange({ isPaused: !state.isPaused })}
          >
            {state.isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="section-tabs" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <button
          className={`tab-btn-sub ${activeSection === 'controller' ? 'active' : ''}`}
          onClick={() => setActiveSection('controller')}
        >
          CONTROL
        </button>
        <button
          className={`tab-btn-sub ${activeSection === 'filters' ? 'active' : ''}`}
          onClick={() => setActiveSection('filters')}
        >
          NOTCH/S
        </button>
        <button
          className={`tab-btn-sub ${activeSection === 'plant' ? 'active' : ''}`}
          onClick={() => setActiveSection('plant')}
        >
          PLANT
        </button>
        <button
          className={`tab-btn-sub ${activeSection === 'autotune' ? 'active' : ''}`}
          onClick={() => setActiveSection('autotune')}
        >
          TUNE
        </button>
        <button
          className={`tab-btn-sub ${activeSection === 'signals' ? 'active' : ''}`}
          onClick={() => setActiveSection('signals')}
        >
          SIGNAL
        </button>
      </div>

      {/* SECTION 1: CONTROLLER ARCHITECTURE & PARAMETERS */}
      {activeSection === 'controller' && (
        <>
          <div className="control-block">
            <div className="block-header">01 // CONTROL ARCHITECTURE</div>
            <div className="param-row">
              <select
                value={state.controlMode}
                onChange={(e) => onChange({ controlMode: e.target.value as any })}
              >
                <option value="pid">PID / 2-DOF PARALLEL CONTROLLER</option>
                <option value="cascade">CASCADE P-PI (POSITION P + VELOCITY PI)</option>
                <option value="smc">SLIDING MODE CONTROL (ROBUST SMC)</option>
              </select>
            </div>
          </div>

          {/* STANDARD PID & 2-DOF */}
          {state.controlMode === 'pid' && (
            <>
              <div className="control-block">
                <div className="block-header">PID CONTROLLER PRESETS</div>
                <div className="param-row">
                  <select onChange={(e) => onApplyPreset(e.target.value)} defaultValue="tuned">
                    <option value="tuned">CRITICALLY DAMPED (FAST & NO OVERSHOOT)</option>
                    <option value="fast">ULTRA HIGH-RESPONSE (SNAPPY BUT STABLE)</option>
                    <option value="oscillatory">UNDERDAMPED (RINGING / OVERSHOOT DEMO)</option>
                    <option value="sluggish">OVERDAMPED (SLOW ASYMPTOTIC CREEP)</option>
                    <option value="windup_demo">WINDUP PHENOMENON DEMO</option>
                  </select>
                </div>
              </div>

              <div className="control-block">
                <div className="block-header">PID GAINS (Kp, Ki, Kd, N)</div>
                <div className="param-row">
                  <div className="param-label">
                    <span>KP (PROPORTIONAL)</span>
                    <input
                      type="number"
                      className="param-input-num"
                      step="0.1"
                      value={state.kp}
                      onChange={(e) => onChange({ kp: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="0.1"
                    value={state.kp}
                    onChange={(e) => onChange({ kp: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="param-row">
                  <div className="param-label">
                    <span>KI (INTEGRAL)</span>
                    <input
                      type="number"
                      className="param-input-num"
                      step="0.1"
                      value={state.ki}
                      onChange={(e) => onChange({ ki: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.1"
                    value={state.ki}
                    onChange={(e) => onChange({ ki: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="param-row">
                  <div className="param-label">
                    <span>KD (DERIVATIVE / DAMPING)</span>
                    <input
                      type="number"
                      className="param-input-num"
                      step="0.01"
                      value={state.kd}
                      onChange={(e) => onChange({ kd: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.01"
                    value={state.kd}
                    onChange={(e) => onChange({ kd: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="param-row">
                  <div className="param-label">
                    <span>FILTER N (CUTOFF RAD/S)</span>
                    <input
                      type="number"
                      className="param-input-num"
                      step="1"
                      value={state.filterN}
                      onChange={(e) => onChange({ filterN: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={state.filterN}
                    onChange={(e) => onChange({ filterN: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="control-block">
                <div className="block-header">2-DOF & FEEDFORWARD</div>
                <div className="param-row">
                  <div className="param-label"><span>ALGORITHM FORM</span></div>
                  <select
                    value={state.form}
                    onChange={(e) => onChange({ form: e.target.value as any })}
                  >
                    <option value="pi_d">PI-D (DERIVATIVE ON PV - RECOMMENDED)</option>
                    <option value="standard">STANDARD PID (DERIVATIVE ON ERROR)</option>
                    <option value="i_pd">I-PD (P & D ON PV)</option>
                    <option value="2dof">2-DOF PID (SETPOINT WEIGHTS b, c)</option>
                  </select>
                </div>

                {state.form === '2dof' && (
                  <>
                    <div className="param-row">
                      <div className="param-label">
                        <span>SETPOINT WEIGHT b (P-TERM)</span>
                        <span className="param-value">{state.setpointWeightB.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={state.setpointWeightB}
                        onChange={(e) => onChange({ setpointWeightB: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="param-row">
                      <div className="param-label">
                        <span>SETPOINT WEIGHT c (D-TERM)</span>
                        <span className="param-value">{state.setpointWeightC.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={state.setpointWeightC}
                        onChange={(e) => onChange({ setpointWeightC: parseFloat(e.target.value) })}
                      />
                    </div>
                  </>
                )}

                <div className="param-row">
                  <div className="param-label">
                    <span>VELOCITY FF (Kvff)</span>
                    <span className="param-value">{state.kvff.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.02"
                    value={state.kvff}
                    onChange={(e) => onChange({ kvff: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="param-row">
                  <div className="param-label">
                    <span>ACCELERATION FF (Kaff)</span>
                    <span className="param-value">{state.kaff.toFixed(4)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.1"
                    step="0.002"
                    value={state.kaff}
                    onChange={(e) => onChange({ kaff: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="param-row">
                  <div className="param-label">
                    <span>FRICTION FF COMP (Kfric)</span>
                    <span className="param-value">{state.kFriction.toFixed(2)} V</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.05"
                    value={state.kFriction}
                    onChange={(e) => onChange({ kFriction: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {/* CASCADE P-PI (INDUSTRIAL STANDARD) */}
          {state.controlMode === 'cascade' && (
            <div className="control-block">
              <div className="block-header">CASCADE P-PI CONTROLLER PARAMETERS</div>
              <p style={{ color: '#a1a1aa', fontSize: '0.68rem', lineHeight: '1.4' }}>
                Position loop generates target velocity (v_ref); Velocity loop regulates motor torque/voltage.
              </p>

              <div className="param-row">
                <div className="param-label">
                  <span>POSITION GAIN Kpp (1/s)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="1"
                    value={state.cascade.kpp}
                    onChange={(e) => onChange({ cascade: { ...state.cascade, kpp: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={state.cascade.kpp}
                  onChange={(e) => onChange({ cascade: { ...state.cascade, kpp: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>VELOCITY P-GAIN Kvp (V·s/rad)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.1"
                    value={state.cascade.kvp}
                    onChange={(e) => onChange({ cascade: { ...state.cascade, kvp: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={state.cascade.kvp}
                  onChange={(e) => onChange({ cascade: { ...state.cascade, kvp: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>VELOCITY I-GAIN Kvi (V/rad)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="1"
                    value={state.cascade.kvi}
                    onChange={(e) => onChange({ cascade: { ...state.cascade, kvi: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={state.cascade.kvi}
                  onChange={(e) => onChange({ cascade: { ...state.cascade, kvi: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>VELOCITY LIMIT (rad/s)</span>
                  <span className="param-value">{state.cascade.max_velocity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={state.cascade.max_velocity}
                  onChange={(e) => onChange({ cascade: { ...state.cascade, max_velocity: parseFloat(e.target.value) } })}
                />
              </div>
            </div>
          )}

          {/* SLIDING MODE CONTROL (SMC) */}
          {state.controlMode === 'smc' && (
            <div className="control-block">
              <div className="block-header">SLIDING MODE CONTROL (ROBUST SMC)</div>
              <p style={{ color: '#a1a1aa', fontSize: '0.68rem', lineHeight: '1.4' }}>
                Constrains state trajectory onto sliding manifold s(t) = e_dot + lambda * e = 0 with continuous boundary layer.
              </p>

              <div className="param-row">
                <div className="param-label">
                  <span>SURFACE SLOPE λ (lambda)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="1"
                    value={state.smc.lambda}
                    onChange={(e) => onChange({ smc: { ...state.smc, lambda: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={state.smc.lambda}
                  onChange={(e) => onChange({ smc: { ...state.smc, lambda: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>ROBUST SWITCHING GAIN K_switch (V)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.5"
                    value={state.smc.k_switch}
                    onChange={(e) => onChange({ smc: { ...state.smc, k_switch: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={state.smc.k_switch}
                  onChange={(e) => onChange({ smc: { ...state.smc, k_switch: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>BOUNDARY LAYER ε (epsilon)</span>
                  <span className="param-value">{state.smc.boundary_epsilon.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={state.smc.boundary_epsilon}
                  onChange={(e) => onChange({ smc: { ...state.smc, boundary_epsilon: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>EQUIVALENT GAIN K_eq</span>
                  <span className="param-value">{state.smc.k_eq.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.05"
                  value={state.smc.k_eq}
                  onChange={(e) => onChange({ smc: { ...state.smc, k_eq: parseFloat(e.target.value) } })}
                />
              </div>
            </div>
          )}

          {/* VOLTAGE SATURATION */}
          <div className="control-block">
            <div className="block-header">VOLTAGE SATURATION</div>
            <div className="param-row">
              <div className="param-label">
                <span>VOLTAGE LIMIT ±UMAX</span>
                <span className="param-value">{state.saturation.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min="1"
                max="48"
                step="0.5"
                value={state.saturation}
                onChange={(e) => onChange({ saturation: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </>
      )}

      {/* SECTION 2: NOTCH FILTER & S-CURVE TRAJECTORY */}
      {activeSection === 'filters' && (
        <>
          <div className="control-block">
            <div className="block-header">BI-QUAD MECHANICAL NOTCH FILTER</div>
            <p style={{ color: '#a1a1aa', fontSize: '0.68rem', lineHeight: '1.4' }}>
              Rejects mechanical resonance frequencies in flexible couplings and gearboxes.
            </p>

            <div className="param-row">
              <button
                className={`btn-mono ${state.notch.enabled ? 'active' : ''}`}
                onClick={() => onChange({ notch: { ...state.notch, enabled: !state.notch.enabled } })}
              >
                {state.notch.enabled ? '● NOTCH FILTER ACTIVE' : '○ NOTCH FILTER BYPASS'}
              </button>
            </div>

            <div className="param-row">
              <div className="param-label">
                <span>CENTER FREQ ω_notch (rad/s)</span>
                <input
                  type="number"
                  className="param-input-num"
                  step="5"
                  value={state.notch.omega_notch}
                  onChange={(e) => onChange({ notch: { ...state.notch, omega_notch: parseFloat(e.target.value) || 10 } })}
                />
              </div>
              <input
                type="range"
                min="20"
                max="400"
                step="5"
                value={state.notch.omega_notch}
                onChange={(e) => onChange({ notch: { ...state.notch, omega_notch: parseFloat(e.target.value) } })}
              />
            </div>

            <div className="param-row">
              <div className="param-label">
                <span>NOTCH DEPTH ζ_num</span>
                <span className="param-value">{state.notch.zeta_num.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.02"
                value={state.notch.zeta_num}
                onChange={(e) => onChange({ notch: { ...state.notch, zeta_num: parseFloat(e.target.value) } })}
              />
            </div>

            <div className="param-row">
              <div className="param-label">
                <span>NOTCH WIDTH ζ_den</span>
                <span className="param-value">{state.notch.zeta_den.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={state.notch.zeta_den}
                onChange={(e) => onChange({ notch: { ...state.notch, zeta_den: parseFloat(e.target.value) } })}
              />
            </div>
          </div>

          <div className="control-block">
            <div className="block-header">S-CURVE / JERK-LIMITED TRAJECTORY</div>
            <p style={{ color: '#a1a1aa', fontSize: '0.68rem', lineHeight: '1.4' }}>
              Generates continuous jerk-limited smooth reference profiles instead of abrupt step inputs.
            </p>

            <div className="param-row">
              <button
                className={`btn-mono ${state.trajectory.enabled ? 'active' : ''}`}
                onClick={() => onChange({ trajectory: { ...state.trajectory, enabled: !state.trajectory.enabled } })}
              >
                {state.trajectory.enabled ? '● S-CURVE GENERATOR ACTIVE' : '○ STEP INPUT (RAW JUMP)'}
              </button>
            </div>

            <div className="param-row">
              <div className="param-label">
                <span>MAX VELOCITY (rad/s)</span>
                <span className="param-value">{state.trajectory.max_vel.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={state.trajectory.max_vel}
                onChange={(e) => onChange({ trajectory: { ...state.trajectory, max_vel: parseFloat(e.target.value) } })}
              />
            </div>

            <div className="param-row">
              <div className="param-label">
                <span>MAX ACCEL (rad/s²)</span>
                <span className="param-value">{state.trajectory.max_acc.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={state.trajectory.max_acc}
                onChange={(e) => onChange({ trajectory: { ...state.trajectory, max_acc: parseFloat(e.target.value) } })}
              />
            </div>

            <div className="param-row">
              <div className="param-label">
                <span>MAX JERK (rad/s³)</span>
                <span className="param-value">{state.trajectory.max_jerk.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="20"
                value={state.trajectory.max_jerk}
                onChange={(e) => onChange({ trajectory: { ...state.trajectory, max_jerk: parseFloat(e.target.value) } })}
              />
            </div>
          </div>
        </>
      )}

      {/* SECTION 3: PLANT DYNAMICS */}
      {activeSection === 'plant' && (
        <>
          <div className="control-block">
            <div className="block-header">PLANT TYPE & INDUSTRIAL HARDWARE</div>
            <div className="param-row">
              <select
                value={state.plantType}
                onChange={(e) => onChange({ plantType: e.target.value as any })}
              >
                <option value="motor_pos">DC MOTOR POSITION (θ)</option>
                <option value="motor_velocity">DC MOTOR VELOCITY (ω)</option>
                <option value="cart">MASS-SPRING-DAMPER (x)</option>
              </select>
            </div>
            <div className="param-row">
              <div className="param-label"><span>INDUSTRIAL PRESETS</span></div>
              <select onChange={(e) => onApplyMotorPreset(e.target.value)} defaultValue="industrial_servo">
                <option value="industrial_servo">1. INDUSTRIAL AC/DC SERVO (FANUC/YASKAWA STYLE)</option>
                <option value="drone_bldc">2. FPV DRONE BLDC MOTOR (ULTRA-LOW INERTIA)</option>
                <option value="cnc_axis">3. PRECISION CNC BALL-SCREW AXIS</option>
                <option value="micro_servo">4. MICRO HOBBY SERVO (SG90 - HIGH FRICTION/GEAR)</option>
                <option value="heavy_joint">5. HEAVY ROBOT JOINT (10KG LOAD)</option>
              </select>
            </div>
          </div>

          {state.plantType.startsWith('motor') ? (
            <div className="control-block">
              <div className="block-header">DC MOTOR PARAMETERS</div>
              
              <div className="param-row">
                <div className="param-label">
                  <span>ROTOR INERTIA J (kg·m²)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.001"
                    value={state.motor.j}
                    onChange={(e) => onChange({ motor: { ...state.motor, j: parseFloat(e.target.value) || 0.0001 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0.0001"
                  max="0.1"
                  step="0.0005"
                  value={state.motor.j}
                  onChange={(e) => onChange({ motor: { ...state.motor, j: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>VISCOUS DAMPING B (N·m·s/rad)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.01"
                    value={state.motor.b}
                    onChange={(e) => onChange({ motor: { ...state.motor, b: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.01"
                  value={state.motor.b}
                  onChange={(e) => onChange({ motor: { ...state.motor, b: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>TORQUE CONSTANT Kt (N·m/A)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.01"
                    value={state.motor.kt}
                    onChange={(e) => onChange({ motor: { ...state.motor, kt: parseFloat(e.target.value) || 0.001 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="1.0"
                  step="0.005"
                  value={state.motor.kt}
                  onChange={(e) => onChange({ motor: { ...state.motor, kt: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>BACK-EMF CONSTANT Ke (V·s/rad)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.01"
                    value={state.motor.ke}
                    onChange={(e) => onChange({ motor: { ...state.motor, ke: parseFloat(e.target.value) || 0.001 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="1.0"
                  step="0.005"
                  value={state.motor.ke}
                  onChange={(e) => onChange({ motor: { ...state.motor, ke: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>ARMATURE RESISTANCE R (Ω)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.1"
                    value={state.motor.r}
                    onChange={(e) => onChange({ motor: { ...state.motor, r: parseFloat(e.target.value) || 0.01 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={state.motor.r}
                  onChange={(e) => onChange({ motor: { ...state.motor, r: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>ARMATURE INDUCTANCE L (H)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.001"
                    value={state.motor.l}
                    onChange={(e) => onChange({ motor: { ...state.motor, l: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.05"
                  step="0.0005"
                  value={state.motor.l}
                  onChange={(e) => onChange({ motor: { ...state.motor, l: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>COULOMB FRICTION (N·m)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.001"
                    value={state.motor.coulomb_friction}
                    onChange={(e) => onChange({ motor: { ...state.motor, coulomb_friction: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.001"
                  value={state.motor.coulomb_friction}
                  onChange={(e) => onChange({ motor: { ...state.motor, coulomb_friction: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>GEAR RATIO N:1</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="1"
                    value={state.motor.gear_ratio}
                    onChange={(e) => onChange({ motor: { ...state.motor, gear_ratio: parseFloat(e.target.value) || 1 } })}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={state.motor.gear_ratio}
                  onChange={(e) => onChange({ motor: { ...state.motor, gear_ratio: parseFloat(e.target.value) } })}
                />
              </div>
            </div>
          ) : (
            <div className="control-block">
              <div className="block-header">MASS-SPRING-DAMPER PARAMETERS</div>
              
              <div className="param-row">
                <div className="param-label">
                  <span>MASS m (kg)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.1"
                    value={state.msd.mass}
                    onChange={(e) => onChange({ msd: { ...state.msd, mass: parseFloat(e.target.value) || 0.1 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={state.msd.mass}
                  onChange={(e) => onChange({ msd: { ...state.msd, mass: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>DAMPING c (N·s/m)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.1"
                    value={state.msd.damping}
                    onChange={(e) => onChange({ msd: { ...state.msd, damping: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={state.msd.damping}
                  onChange={(e) => onChange({ msd: { ...state.msd, damping: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>SPRING STIFFNESS k (N/m)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.1"
                    value={state.msd.stiffness}
                    onChange={(e) => onChange({ msd: { ...state.msd, stiffness: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={state.msd.stiffness}
                  onChange={(e) => onChange({ msd: { ...state.msd, stiffness: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="param-row">
                <div className="param-label">
                  <span>FRICTION FORCE (N)</span>
                  <input
                    type="number"
                    className="param-input-num"
                    step="0.01"
                    value={state.msd.friction}
                    onChange={(e) => onChange({ msd: { ...state.msd, friction: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.02"
                  value={state.msd.friction}
                  onChange={(e) => onChange({ msd: { ...state.msd, friction: parseFloat(e.target.value) } })}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* SECTION 4: AUTO-TUNING SUITE */}
      {activeSection === 'autotune' && (
        <div className="control-block">
          <div className="block-header">ONE-CLICK GAIN SYNTHESIS & TUNING</div>
          <p style={{ color: '#a1a1aa', fontSize: '0.68rem', lineHeight: '1.4' }}>
            Calculates mathematically optimal PID parameters based on the current plant physical parameters.
          </p>

          <div className="button-grid" style={{ gridTemplateColumns: '1fr' }}>
            <button className="btn-mono" onClick={() => onAutoTune('pole_smooth')}>
              POLE PLACEMENT (CRITICALLY DAMPED ζ=1.0)
            </button>
            <button className="btn-mono" onClick={() => onAutoTune('pole_fast')}>
              POLE PLACEMENT (FAST BUTTERWORTH ζ=0.707)
            </button>
            <button className="btn-mono" onClick={() => onAutoTune('chr0')}>
              CHIEN-HRONES-RESWICK (0% OVERSHOOT)
            </button>
            <button className="btn-mono" onClick={() => onAutoTune('chr20')}>
              CHIEN-HRONES-RESWICK (20% OVERSHOOT)
            </button>
            <button className="btn-mono" onClick={() => onAutoTune('zn')}>
              ZIEGLER-NICHOLS (CLASSICAL)
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: SIGNALS, DISTURBANCE & TEST CONTROLS */}
      {activeSection === 'signals' && (
        <div className="control-block">
          <div className="block-header">SIGNALS, DISTURBANCE & EXCITATION</div>
          
          <div className="param-row">
            <div className="param-label">
              <span>SETPOINT TARGET (r)</span>
              <span className="param-value">{state.target.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-3.14"
              max="3.14"
              step="0.05"
              value={state.target}
              onChange={(e) => onChange({ target: parseFloat(e.target.value) })}
            />
          </div>

          <div className="param-row">
            <div className="param-label">
              <span>LOAD DISTURBANCE (d)</span>
              <span className="param-value">{state.disturbance.toFixed(1)} N·m</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.2"
              value={state.disturbance}
              onChange={(e) => onChange({ disturbance: parseFloat(e.target.value) })}
            />
          </div>

          <div className="param-row">
            <div className="param-label">
              <span>SENSOR NOISE AMPLITUDE</span>
              <span className="param-value">{state.noise.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              value={state.noise}
              onChange={(e) => onChange({ noise: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      )}
    </aside>
  );
});

PidControls.displayName = 'PidControls';
