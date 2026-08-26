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
          <span>対象システム (Plant)</span>
        </div>
        <div className="form-group">
          <select
            value={state.plantType}
            onChange={(e) => onChange({ plantType: e.target.value as any })}
          >
            <option value="motor_pos">DCモータ 位置制御 (θ)</option>
            <option value="motor_velocity">DCモータ 速度制御 (ω)</option>
            <option value="cart">バネ・マス・ダンパ系 台車 (x)</option>
          </select>
        </div>

        <div className="form-group">
          <label>プリセット</label>
          <select onChange={(e) => onApplyPreset(e.target.value)} defaultValue="tuned">
            <option value="tuned">最適調整 (適度な減衰・速い応答)</option>
            <option value="oscillatory">振動的 (高ゲイン Kp 過大)</option>
            <option value="sluggish">遅い応答 (低ゲイン P不足)</option>
            <option value="windup_demo">ワインドアップ発生実験 (飽和 + 過大 I)</option>
            <option value="ipd_demo">I-PD制御 (キック防止比較)</option>
          </select>
        </div>
      </div>

      <div>
        <div className="section-title">
          <span>PID パラメータ</span>
        </div>

        <div className="form-group">
          <label>
            比例ゲイン Kp: <span className="val">{state.kp.toFixed(1)}</span>
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
            積分ゲイン Ki: <span className="val">{state.ki.toFixed(1)}</span>
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
            微分ゲイン Kd: <span className="val">{state.kd.toFixed(2)}</span>
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
            微分フィルタ N: <span className="val">{state.filterN.toFixed(0)}</span>
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
          <span>制御器構造 & アンチワインドアップ</span>
        </div>

        <div className="form-group">
          <label>制御器アルゴリズム</label>
          <select
            value={state.form}
            onChange={(e) => onChange({ form: e.target.value as any })}
          >
            <option value="standard">標準PID (P, I, D すべて偏差)</option>
            <option value="pi_d">PI-D (微分先行型: 微分項を測定値から計算)</option>
            <option value="i_pd">I-PD (比例・微分先行型: P, Dを測定値から計算)</option>
          </select>
        </div>

        <div className="form-group">
          <label>アンチワインドアップ (Anti-Windup)</label>
          <select
            value={state.antiWindup}
            onChange={(e) => onChange({ antiWindup: e.target.value as any })}
          >
            <option value="clamping">Clamping (条件付き積分停止)</option>
            <option value="back_calc">Back-calculation (逆計算トラッキング)</option>
            <option value="none">None (ワインドアップ対策なし)</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            操作量 飽和リミット (±Umax): <span className="val">{state.saturation.toFixed(1)}</span>
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
          <span>目標値 & 外乱・ノイズ</span>
        </div>

        <div className="form-group">
          <label>
            目標値 (Setpoint): <span className="val">{state.target.toFixed(2)}</span>
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
            負荷外乱 (Disturbance): <span className="val">{state.disturbance.toFixed(1)}</span>
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
            センサノイズ振幅: <span className="val">{state.noise.toFixed(3)}</span>
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
            ステップ入力 (反転)
          </button>
          <button className="btn" onClick={onPulseDisturbance}>
            <Flame style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
            瞬間外乱付加
          </button>
        </div>

        <div className="btn-row">
          <button className="btn btn-danger" onClick={onReset}>
            <RotateCcw style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
            リセット
          </button>
          <button
            className={`btn ${state.isPaused ? 'btn-active' : ''}`}
            onClick={() => onChange({ isPaused: !state.isPaused })}
          >
            {state.isPaused ? (
              <>
                <Play style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> 再開
              </>
            ) : (
              <>
                <Pause style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> 一時停止
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
