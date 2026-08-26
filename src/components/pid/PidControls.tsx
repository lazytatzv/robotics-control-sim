import React from 'react';
import { Play, Pause, RotateCcw, Zap, Flame } from 'lucide-react';

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
      <div className="control-section">
        <div className="section-label">Plant & Preset</div>
        <div className="form-group">
          <select
            value={state.plantType}
            onChange={(e) => onChange({ plantType: e.target.value as any })}
          >
            <option value="motor_pos">DC Motor Position (θ)</option>
            <option value="motor_velocity">DC Motor Velocity (ω)</option>
            <option value="cart">Mass-Spring-Damper (x)</option>
          </select>
        </div>
        <div className="form-group">
          <select onChange={(e) => onApplyPreset(e.target.value)} defaultValue="tuned">
            <option value="tuned">Preset: Well-Tuned</option>
            <option value="oscillatory">Preset: Underdamped (High Kp)</option>
            <option value="sluggish">Preset: Overdamped (Low Kp)</option>
            <option value="windup_demo">Preset: Integrator Windup Demo</option>
            <option value="ipd_demo">Preset: I-PD Kick Prevention</option>
          </select>
        </div>
      </div>

      {/* PID Gains */}
      <div className="control-section">
        <div className="section-label">Controller Gains</div>
        <div className="form-group">
          <label>
            Kp (Proportional) <span className="val">{state.kp.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="30"
            step="0.1"
            value={state.kp}
            onChange={(e) => onChange({ kp: parseFloat(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Ki (Integral) <span className="val">{state.ki.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="25"
            step="0.1"
            value={state.ki}
            onChange={(e) => onChange({ ki: parseFloat(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Kd (Derivative) <span className="val">{state.kd.toFixed(3)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.01"
            value={state.kd}
            onChange={(e) => onChange({ kd: parseFloat(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Filter N (Cutoff) <span className="val">{state.filterN.toFixed(0)}</span>
          </label>
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

      {/* Architecture & Anti-Windup */}
      <div className="control-section">
        <div className="section-label">Structure & Limits</div>
        <div className="form-group">
          <label>Structure</label>
          <select
            value={state.form}
            onChange={(e) => onChange({ form: e.target.value as any })}
          >
            <option value="standard">Standard PID</option>
            <option value="pi_d">PI-D (Derivative on PV)</option>
            <option value="i_pd">I-PD (Proportional & Deriv on PV)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Anti-Windup</label>
          <select
            value={state.antiWindup}
            onChange={(e) => onChange({ antiWindup: e.target.value as any })}
          >
            <option value="clamping">Clamping (Conditional)</option>
            <option value="back_calc">Back-Calculation (Kb=1.0)</option>
            <option value="none">None (Unbounded)</option>
          </select>
        </div>
        <div className="form-group">
          <label>
            Limit ±Umax <span className="val">{state.saturation.toFixed(1)} V</span>
          </label>
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
      <div className="control-section">
        <div className="section-label">Signals & Disturbance</div>
        <div className="form-group">
          <label>
            Setpoint (r) <span className="val">{state.target.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="-3.14"
            max="3.14"
            step="0.05"
            value={state.target}
            onChange={(e) => onChange({ target: parseFloat(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Load Torque (d) <span className="val">{state.disturbance.toFixed(1)} N·m</span>
          </label>
          <input
            type="range"
            min="-5"
            max="5"
            step="0.1"
            value={state.disturbance}
            onChange={(e) => onChange({ disturbance: parseFloat(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Noise Amplitude <span className="val">{state.noise.toFixed(3)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.005"
            value={state.noise}
            onChange={(e) => onChange({ noise: parseFloat(e.target.value) })}
          />
        </div>

        <div className="btn-group">
          <button className="btn btn-accent" onClick={onStepInput}>
            <Zap size={12} />
            Step Invert
          </button>
          <button className="btn" onClick={onPulseDisturbance}>
            <Flame size={12} />
            Pulse Load
          </button>
        </div>
        <div className="btn-group">
          <button className="btn" onClick={onReset}>
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            className={`btn ${state.isPaused ? 'btn-primary' : ''}`}
            onClick={() => onChange({ isPaused: !state.isPaused })}
          >
            {state.isPaused ? <><Play size={12} /> Run</> : <><Pause size={12} /> Pause</>}
          </button>
        </div>
      </div>
    </aside>
  );
};
