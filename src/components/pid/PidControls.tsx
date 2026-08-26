import React from 'react';

export interface PidControlState {
  plantType: 'motor_pos' | 'motor_velocity' | 'cart';
  kp: number;
  ki: number;
  kd: number;
  filterN: number;
  form: 'standard' | 'pi_d' | 'i_pd';
  antiWindup: 'clamping' | 'back_calc' | 'none';
  saturation: number;
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
}

export const PidControls: React.FC<PidControlsProps> = ({
  state,
  onChange,
  onReset,
  onStepInput,
  onPulseDisturbance,
  onApplyPreset,
}) => {
  return (
    <aside className="sidebar">
      {/* Plant Configuration */}
      <div className="control-block">
        <div className="block-header">01 // PLANT & PRESET</div>
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
          <select onChange={(e) => onApplyPreset(e.target.value)} defaultValue="tuned">
            <option value="tuned">PRESET: CRITICALLY DAMPED (0% OVERSHOOT, FAST)</option>
            <option value="fast">PRESET: ULTRA HIGH-RESPONSE (SNAPPY)</option>
            <option value="oscillatory">PRESET: UNDERDAMPED (RINGING / OVERSHOOT)</option>
            <option value="sluggish">PRESET: OVERDAMPED (SLOW CREEP)</option>
            <option value="windup_demo">PRESET: WINDUP DEMO (SATURATION)</option>
          </select>
        </div>
      </div>

      {/* PID Gains */}
      <div className="control-block">
        <div className="block-header">02 // CONTROLLER GAINS</div>
        <div className="param-row">
          <div className="param-label">
            <span>KP (PROPORTIONAL)</span>
            <span className="param-value">{state.kp.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="0.1"
            value={state.kp}
            onChange={(e) => onChange({ kp: parseFloat(e.target.value) })}
          />
        </div>
        <div className="param-row">
          <div className="param-label">
            <span>KI (INTEGRAL)</span>
            <span className="param-value">{state.ki.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="0.1"
            value={state.ki}
            onChange={(e) => onChange({ ki: parseFloat(e.target.value) })}
          />
        </div>
        <div className="param-row">
          <div className="param-label">
            <span>KD (DERIVATIVE / DAMPING)</span>
            <span className="param-value">{state.kd.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="0.01"
            value={state.kd}
            onChange={(e) => onChange({ kd: parseFloat(e.target.value) })}
          />
        </div>
        <div className="param-row">
          <div className="param-label">
            <span>FILTER N (CUTOFF)</span>
            <span className="param-value">{state.filterN.toFixed(0)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={state.filterN}
            onChange={(e) => onChange({ filterN: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {/* Structure & Limits */}
      <div className="control-block">
        <div className="block-header">03 // STRUCTURE & LIMITS</div>
        <div className="param-row">
          <div className="param-label"><span>ALGORITHM FORM</span></div>
          <select
            value={state.form}
            onChange={(e) => onChange({ form: e.target.value as any })}
          >
            <option value="pi_d">PI-D (DERIVATIVE ON PV - RECOMMENDED)</option>
            <option value="standard">STANDARD PID</option>
            <option value="i_pd">I-PD (PROPORTIONAL & DERIV ON PV)</option>
          </select>
        </div>
        <div className="param-row">
          <div className="param-label"><span>ANTI-WINDUP</span></div>
          <select
            value={state.antiWindup}
            onChange={(e) => onChange({ antiWindup: e.target.value as any })}
          >
            <option value="clamping">CLAMPING (CONDITIONAL)</option>
            <option value="back_calc">BACK-CALCULATION (KB=1.0)</option>
            <option value="none">NONE (UNCONSTRAINED)</option>
          </select>
        </div>
        <div className="param-row">
          <div className="param-label">
            <span>LIMIT ±UMAX</span>
            <span className="param-value">{state.saturation.toFixed(1)} V</span>
          </div>
          <input
            type="range"
            min="1"
            max="24"
            step="0.5"
            value={state.saturation}
            onChange={(e) => onChange({ saturation: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {/* Signals & Testing */}
      <div className="control-block">
        <div className="block-header">04 // SIGNALS & DISTURBANCE</div>
        <div className="param-row">
          <div className="param-label">
            <span>SETPOINT (r)</span>
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
            <span>LOAD TORQUE (d)</span>
            <span className="param-value">{state.disturbance.toFixed(1)} N·m</span>
          </div>
          <input
            type="range"
            min="-5"
            max="5"
            step="0.1"
            value={state.disturbance}
            onChange={(e) => onChange({ disturbance: parseFloat(e.target.value) })}
          />
        </div>
        <div className="param-row">
          <div className="param-label">
            <span>NOISE AMPLITUDE</span>
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
    </aside>
  );
};
