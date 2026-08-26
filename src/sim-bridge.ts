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
  ff_term: number;
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
  form: 'standard' | 'pi_d' | 'i_pd' | '2dof';
  kb: number;
  setpoint_weight_b: number;
  setpoint_weight_c: number;
  kvff: number;
  kaff: number;
  k_friction: number;
  deadband: number;
}

export interface MotorSettings {
  j: number;
  b: number;
  kt: number;
  ke: number;
  r: number;
  l: number;
  coulomb_friction: number;
  gear_ratio: number;
}

export interface MsdSettings {
  mass: number;
  damping: number;
  stiffness: number;
  friction: number;
}

export interface BodePoint {
  omega: number;
  mag_db: number;
  phase_deg: number;
  closed_loop_mag_db: number;
}

export interface BodeAnalysis {
  points: BodePoint[];
  gain_crossover_freq?: number;
  phase_margin_deg?: number;
  phase_crossover_freq?: number;
  gain_margin_db?: number;
  is_stable: boolean;
  bandwidth?: number;
}

export interface CascadeSettings {
  kpp: number;
  kvp: number;
  kvi: number;
  max_velocity: number;
  max_voltage: number;
}

export interface SmcSettings {
  lambda: number;
  k_switch: number;
  boundary_epsilon: number;
  k_eq: number;
  max_voltage: number;
}

export interface NotchSettings {
  omega_notch: number;
  zeta_num: number;
  zeta_den: number;
  enabled: boolean;
}

export interface TrajectorySettings {
  max_vel: number;
  max_acc: number;
  max_jerk: number;
  enabled: boolean;
}

export interface TunedGains {
  kp: number;
  ki: number;
  kd: number;
  filter_n: number;
  method_name: string;
}

let isInitialized = false;

export async function initializeWasm(): Promise<void> {
  if (!isInitialized) {
    await initWasm();
    isInitialized = true;
  }
}

export { Simulator, arm2_fk, arm2_ik };
