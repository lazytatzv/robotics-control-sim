//! Advanced Modern & Robust Control Algorithms for Robotics and Motion Control.
//!
//! Includes:
//! 1. Cascade P-PI Dual-Loop Servo Controller (Industrial Standard)
//! 2. Sliding Mode Controller (SMC with boundary layer for chattering suppression)
//! 3. Bi-quad Notch Filter (Resonance rejection)
//! 4. S-Curve / Trapezoidal Trajectory Profile Generator

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

/// Controller Architecture Paradigm
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub enum ControlMode {
    Pid,
    CascadePpi,
    SlidingMode,
}

/// Cascade P-PI Controller (Position P + Velocity PI)
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct CascadeConfig {
    /// Position loop proportional gain Kpp [1/s]
    pub kpp: f64,
    /// Velocity loop proportional gain Kvp [V/(rad/s)]
    pub kvp: f64,
    /// Velocity loop integral gain Kvi [V/rad]
    pub kvi: f64,
    /// Maximum velocity reference limit [rad/s]
    pub max_velocity: f64,
    /// Maximum acceleration reference limit [rad/s^2]
    pub max_accel: f64,
    /// Output voltage limit [V]
    pub max_voltage: f64,
}

impl Default for CascadeConfig {
    fn default() -> Self {
        Self {
            kpp: 20.0,
            kvp: 1.5,
            kvi: 15.0,
            max_velocity: 15.0,
            max_accel: 50.0,
            max_voltage: 12.0,
        }
    }
}

/// Cascade Controller State
#[derive(Debug, Clone)]
pub struct CascadeController {
    pub config: CascadeConfig,
    pub vel_integral: f64,
}

impl CascadeController {
    pub fn new(config: CascadeConfig) -> Self {
        Self {
            config,
            vel_integral: 0.0,
        }
    }

    pub fn reset(&mut self) {
        self.vel_integral = 0.0;
    }

    /// Step cascade control: Outer position P -> Inner velocity PI
    pub fn update(&mut self, pos_setpoint: f64, pos_actual: f64, vel_actual: f64, dt: f64) -> (f64, f64, f64) {
        if dt <= 0.0 {
            return (0.0, 0.0, 0.0);
        }

        // Outer Position Loop: P-control yields target velocity
        let pos_error = pos_setpoint - pos_actual;
        let target_vel_raw = self.config.kpp * pos_error;
        let target_vel = target_vel_raw.clamp(-self.config.max_velocity, self.config.max_velocity);

        // Inner Velocity Loop: PI-control yields voltage
        let vel_error = target_vel - vel_actual;
        let p_out = self.config.kvp * vel_error;
        let i_cand = self.config.kvi * self.vel_integral;

        let u_unsat = p_out + i_cand;
        let u_sat = u_unsat.clamp(-self.config.max_voltage, self.config.max_voltage);

        // Anti-windup on velocity integrator
        if (u_unsat > self.config.max_voltage && vel_error > 0.0)
            || (u_unsat < -self.config.max_voltage && vel_error < 0.0)
        {
            // Clamped
        } else {
            self.vel_integral += vel_error * dt;
        }

        (u_sat, target_vel, pos_error)
    }
}

/// Sliding Mode Control (SMC) Configuration
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct SmcConfig {
    /// Sliding surface slope lambda (s = e_dot + lambda * e)
    pub lambda: f64,
    /// Robust switching gain K_switch [V]
    pub k_switch: f64,
    /// Boundary layer thickness epsilon (smoothes chattering)
    pub boundary_epsilon: f64,
    /// Equivalent control gain (model-based feedforward)
    pub k_eq: f64,
    /// Max output voltage
    pub max_voltage: f64,
}

impl Default for SmcConfig {
    fn default() -> Self {
        Self {
            lambda: 15.0,
            k_switch: 8.0,
            boundary_epsilon: 0.1,
            k_eq: 0.5,
            max_voltage: 12.0,
        }
    }
}

/// Sliding Mode Controller
#[derive(Debug, Clone)]
pub struct SmcController {
    pub config: SmcConfig,
    prev_pos: f64,
    initialized: bool,
}

impl SmcController {
    pub fn new(config: SmcConfig) -> Self {
        Self {
            config,
            prev_pos: 0.0,
            initialized: false,
        }
    }

    pub fn reset(&mut self) {
        self.prev_pos = 0.0;
        self.initialized = false;
    }

    pub fn update(&mut self, pos_setpoint: f64, pos_actual: f64, vel_actual: f64, dt: f64) -> (f64, f64, f64) {
        if dt <= 0.0 {
            return (0.0, 0.0, 0.0);
        }

        let pos_error = pos_setpoint - pos_actual;
        let vel_error = -vel_actual; // assuming constant or step setpoint (target_vel = 0)

        // Sliding surface: s = vel_error + lambda * pos_error
        let s = vel_error + self.config.lambda * pos_error;

        // Continuous saturation function over boundary layer epsilon to eliminate chattering:
        // sat(s / eps) = s / eps if |s| <= eps, else sign(s)
        let sat_s = if s.abs() <= self.config.boundary_epsilon {
            s / self.config.boundary_epsilon.max(1e-4)
        } else {
            s.signum()
        };

        // Equivalent control + robust discontinuous control
        let u_eq = self.config.k_eq * (self.config.lambda * pos_error);
        let u_robust = self.config.k_switch * sat_s;

        let u_total = (u_eq + u_robust).clamp(-self.config.max_voltage, self.config.max_voltage);

        (u_total, s, pos_error)
    }
}

/// 2nd-order Bi-quad Notch Filter for mechanical resonance suppression
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct NotchFilter {
    /// Notch center frequency [rad/s]
    pub omega_notch: f64,
    /// Notch depth / damping ratio zeta_num
    pub zeta_num: f64,
    /// Notch width / damping ratio zeta_den
    pub zeta_den: f64,
    /// Filter state memory
    x1: f64,
    x2: f64,
}

impl Default for NotchFilter {
    fn default() -> Self {
        Self {
            omega_notch: 120.0,
            zeta_num: 0.05,
            zeta_den: 0.707,
            x1: 0.0,
            x2: 0.0,
        }
    }
}

impl NotchFilter {
    pub fn new(omega_notch: f64, zeta_num: f64, zeta_den: f64) -> Self {
        Self {
            omega_notch,
            zeta_num,
            zeta_den,
            x1: 0.0,
            x2: 0.0,
        }
    }

    pub fn reset(&mut self) {
        self.x1 = 0.0;
        self.x2 = 0.0;
    }

    /// Process input sample u through bilinear-discretized notch filter
    pub fn process(&mut self, u_in: f64, dt: f64) -> f64 {
        if dt <= 0.0 || self.omega_notch <= 0.0 {
            return u_in;
        }

        // Continuous H(s) = (s^2 + 2*zeta_n*w*s + w^2) / (s^2 + 2*zeta_d*w*s + w^2)
        // Direct state-space integration via Euler/Tustin
        let w = self.omega_notch;
        let dx1 = self.x2;
        let dx2 = u_in - 2.0 * self.zeta_den * w * self.x2 - w * w * self.x1;

        self.x1 += dx1 * dt;
        self.x2 += dx2 * dt;

        // Output y = (num terms)
        let y = u_in + 2.0 * (self.zeta_num - self.zeta_den) * w * self.x2;
        y
    }
}

/// S-Curve Trajectory Profile Generator (Jerk-limited smooth profile)
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct SCurveGenerator {
    pub max_vel: f64,
    pub max_acc: f64,
    pub max_jerk: f64,

    pub current_pos: f64,
    pub current_vel: f64,
    pub current_acc: f64,
}

impl Default for SCurveGenerator {
    fn default() -> Self {
        Self {
            max_vel: 10.0,
            max_acc: 30.0,
            max_jerk: 150.0,
            current_pos: 0.0,
            current_vel: 0.0,
            current_acc: 0.0,
        }
    }
}

impl SCurveGenerator {
    pub fn reset(&mut self, pos: f64) {
        self.current_pos = pos;
        self.current_vel = 0.0;
        self.current_acc = 0.0;
    }

    /// Step smooth profile towards target position
    pub fn step(&mut self, target_pos: f64, dt: f64) -> (f64, f64, f64) {
        let pos_err = target_pos - self.current_pos;
        if pos_err.abs() < 1e-4 && self.current_vel.abs() < 1e-3 {
            self.current_pos = target_pos;
            self.current_vel = 0.0;
            self.current_acc = 0.0;
            return (self.current_pos, self.current_vel, self.current_acc);
        }

        // Proportional-derivative trajectory tracking with jerk limit
        let desired_vel = (pos_err * 8.0).clamp(-self.max_vel, self.max_vel);
        let vel_err = desired_vel - self.current_vel;
        let desired_acc = (vel_err * 15.0).clamp(-self.max_acc, self.max_acc);

        let acc_diff = desired_acc - self.current_acc;
        let max_jerk_dt = self.max_jerk * dt;
        let jerk = acc_diff.clamp(-max_jerk_dt, max_jerk_dt);

        self.current_acc += jerk;
        self.current_vel += self.current_acc * dt;
        self.current_pos += self.current_vel * dt;

        (self.current_pos, self.current_vel, self.current_acc)
    }
}

/// Signal Generator Excitation Type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub enum SignalType {
    Step,
    Impulse,
    Ramp,
    Chirp,
}

/// Dynamic Excitation Signal Generator
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct SignalGenerator {
    pub signal_type: SignalType,
    pub amplitude: f64,
    pub frequency_start: f64, // for Chirp (Hz)
    pub frequency_end: f64,   // for Chirp (Hz)
    pub chirp_duration: f64,  // Chirp period (s)
    pub ramp_slope: f64,      // rad/s for Ramp
}

impl Default for SignalGenerator {
    fn default() -> Self {
        Self {
            signal_type: SignalType::Step,
            amplitude: 1.57,
            frequency_start: 0.2,
            frequency_end: 15.0,
            chirp_duration: 10.0,
            ramp_slope: 1.0,
        }
    }
}

impl SignalGenerator {
    /// Generate reference signal value at time t
    pub fn evaluate(&self, t: f64, base_target: f64) -> (f64, f64) {
        match self.signal_type {
            SignalType::Step => (base_target, 0.0),
            SignalType::Impulse => {
                // Approximate Dirac delta pulse of width 0.05s starting at t % 3.0s == 0.5s
                let period_t = t % 3.0;
                if period_t >= 0.5 && period_t <= 0.55 {
                    (self.amplitude * 2.0, 0.0)
                } else {
                    (0.0, 0.0)
                }
            }
            SignalType::Ramp => {
                // Sawtooth / continuous bidirectional ramp
                let period = 6.0;
                let phase = t % period;
                let target = if phase < period * 0.5 {
                    -self.amplitude + (phase / (period * 0.5)) * (2.0 * self.amplitude)
                } else {
                    self.amplitude - ((phase - period * 0.5) / (period * 0.5)) * (2.0 * self.amplitude)
                };
                let vel = if phase < period * 0.5 { self.ramp_slope } else { -self.ramp_slope };
                (target, vel)
            }
            SignalType::Chirp => {
                // Linear frequency sweep chirp sine
                let period_t = t % self.chirp_duration;
                let f0 = self.frequency_start;
                let f1 = self.frequency_end;
                let t_dur = self.chirp_duration;
                let k = (f1 - f0) / t_dur;
                let phi = 2.0 * std::f64::consts::PI * (f0 * period_t + 0.5 * k * period_t * period_t);
                let val = self.amplitude * phi.sin();
                let inst_freq = 2.0 * std::f64::consts::PI * (f0 + k * period_t);
                let vel = self.amplitude * inst_freq * phi.cos();
                (val, vel)
            }
        }
    }
}
