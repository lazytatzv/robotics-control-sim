import initWasm, { Simulator, arm2_fk, arm2_ik } from '../pkg/wasm_bridge.js';

export interface StepDataPoint {
  t: number;
  setpoint: number;
  actual: number;
  velocity: number;
  error: number;
  u: number;
  p_term: number;
  i_term: number;
  d_term: number;
  is_saturated: boolean;
  current: number;
}

export interface PidSettings {
  kp: number;
  ki: number;
  kd: number;
  filter_n: number;
  min_output: number;
  max_output: number;
  anti_windup: 'clamping' | 'back_calc' | 'none';
  form: 'standard' | 'pi_d' | 'i_pd';
  kb: number;
}

export interface MotorSettings {
  j: number;
  b: number;
  kt: number;
  ke: number;
  r: number;
  l: number;
  coulomb_friction: number;
}

let isInitialized = false;

export async function initializeWasm(): Promise<void> {
  if (!isInitialized) {
    await initWasm();
    isInitialized = true;
  }
}

export { Simulator, arm2_fk, arm2_ik };
