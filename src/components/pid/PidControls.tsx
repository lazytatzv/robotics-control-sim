import React from 'react';
import { RotateCcw, Play, Pause, Zap, Flame } from 'lucide-react';

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
    <aside className="sidebar card">
      <div>
        <div className="section-title">
          <span>Target System (Plant)</span>
        </div>
        <div className="form-group">
          <select
            value={state.plantType}
            onChange={(e) => onChange({ plantType: e.target.value as any })}
          >
            <option value="motor_pos">DC Motor Position Control (θ)</option>
            <option value="motor_velocity">DC Motor Velocity Control (ω)</option>
            <option value="cart">Mass-Spring-Damper Cart (x)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Presets</label>
          <select onChange={(e) => onApplyPreset(e.target.value)} defaultValue="tuned">
            <option value="tuned">Well-Tuned (Fast & Damped)</option>
            <option value="oscillatory">Oscillatory (High Kp)</option>
            <option value="sluggish">Sluggish (Low Kp)</option>
            <option value="windup_demo">Windup Demonstration (Saturation + High Ki)</option>
            <option value="ipd_demo">I-PD Control (Kick Prevention)</option>
          </select>
        </div>
      </div>

      <div>
        <div className="section-title">
          <span>PID Parameters</span>
        </div>

        <div className="form-group">
          <label>
            Proportional Gain Kp: <span className="val">{state.kp.toFixed(1)}</span>
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
            Integral Gain Ki: <span className="val">{state.ki.toFixed(1)}</span>
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
            Derivative Gain Kd: <span className="val">{state.kd.toFixed(2)}</span>
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
            Derivative Filter N: <span className="val">{state.filterN.toFixed(0)}</span>
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

      <div>
        <div className="section-title">
          <span>Controller Form & Anti-Windup</span>
        </div>

        <div className="form-group">
          <label>Algorithm Form</label>
          <select
            value={state.form}
            onChange={(e) => onChange({ form: e.target.value as any })}
          >
            <option value="standard">Standard PID (P, I, D on Error)</option>
            <option value="pi_d">PI-D (Derivative on Measurement)</option>
            <option value="i_pd">I-PD (Proportional & Derivative on Measurement)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Anti-Windup Method</label>
          <select
            value={state.antiWindup}
            onChange={(e) => onChange({ antiWindup: e.target.value as any })}
          >
            <option value="clamping">Clamping (Conditional Integration)</option>
            <option value="back_calc">Back-Calculation Tracking</option>
            <option value="none">None (Unconstrained Windup)</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Output Saturation Limit (±Umax): <span className="val">{state.saturation.toFixed(1)}</span>
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

      <div>
        <div className="section-title">
          <span>Setpoint, Disturbance & Noise</span>
        </div>

        <div className="form-group">
          <label>
            Target Setpoint: <span className="val">{state.target.toFixed(2)}</span>
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
            Load Disturbance: <span className="val">{state.disturbance.toFixed(1)}</span>
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
            Sensor Noise Amplitude: <span className="val">{state.noise.toFixed(3)}</span>
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

        <div className="btn-row">
          <button className="btn btn-primary" onClick={onStepInput}>
            <Zap style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
            Step Input (Invert)
          </button>
          <button className="btn" onClick={onPulseDisturbance}>
            <Flame style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
            Pulse Disturbance
          </button>
        </div>

        <div className="btn-row">
          <button className="btn btn-danger" onClick={onReset}>
            <RotateCcw style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
            Reset
          </button>
          <button
            className={`btn ${state.isPaused ? 'btn-active' : ''}`}
            onClick={() => onChange({ isPaused: !state.isPaused })}
          >
            {state.isPaused ? (
              <>
                <Play style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Resume
              </>
            ) : (
              <>
                <Pause style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Pause
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
