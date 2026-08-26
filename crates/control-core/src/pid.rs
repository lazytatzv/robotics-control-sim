//! Professional-grade discrete PID controller implementation.
//! 
//! Supports 2-DOF PID, Standard PID, I-PD, PI-D, Low-pass filtered derivative,
//! Velocity/Acceleration Feedforward, Anti-windup (Clamping & Back-calculation),
//! Deadband, and Saturation limits.

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

/// Anti-windup method
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub enum AntiWindupMethod {
    None,
    Clamping,
    BackCalculation,
}

/// PID controller structure form
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub enum PidForm {
    /// Standard PID: Error fed to P, I, and D (b=1.0, c=1.0)
    Standard,
    /// PI-D (Derivative on Measurement): Avoids setpoint kicks (b=1.0, c=0.0)
    DerivativeOnMeasurement,
    /// I-PD: Both P and D act on measurement, only I on error (b=0.0, c=0.0)
    IPD,
    /// 2-DOF PID: Explicit setpoint weighting factors b and c
    TwoDegreeOfFreedom,
}

/// Configuration parameters for PID controller
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct PidConfig {
    pub kp: f64,
    pub ki: f64,
    pub kd: f64,
    /// Derivative low-pass filter coefficient N (cutoff freq approx N rad/s)
    /// Typical range: 5.0 to 50.0. If <= 0.0, no filter is applied.
    pub filter_n: f64,
    /// Minimum output limit (saturation)
    pub min_output: f64,
    /// Maximum output limit (saturation)
    pub max_output: f64,
    /// Anti-windup method
    pub anti_windup: AntiWindupMethod,
    /// Back-calculation tracking gain Kb
    pub kb: f64,
    /// Form of PID (Standard, PI-D, I-PD, TwoDegreeOfFreedom)
    pub form: PidForm,
    /// 2-DOF Setpoint weight on Proportional term (0.0 <= b <= 1.0)
    pub setpoint_weight_b: f64,
    /// 2-DOF Setpoint weight on Derivative term (0.0 <= c <= 1.0)
    pub setpoint_weight_c: f64,
    /// Velocity Feedforward Gain Kvff
    pub kvff: f64,
    /// Acceleration Feedforward Gain Kaff
    pub kaff: f64,
    /// Friction Feedforward (Coulomb compensation)
    pub k_friction: f64,
    /// Control deadband (error threshold below which error is treated as 0)
    pub deadband: f64,
}

impl Default for PidConfig {
    fn default() -> Self {
        Self {
            kp: 1.0,
            ki: 0.0,
            kd: 0.0,
            filter_n: 20.0,
            min_output: -12.0,
            max_output: 12.0,
            anti_windup: AntiWindupMethod::Clamping,
            kb: 1.0,
            form: PidForm::Standard,
            setpoint_weight_b: 1.0,
            setpoint_weight_c: 1.0,
            kvff: 0.0,
            kaff: 0.0,
            k_friction: 0.0,
            deadband: 0.0,
        }
    }
}

/// Internal state and diagnostics for a single step
#[derive(Debug, Clone, Copy, Default)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct PidOutput {
    /// Saturated final control output u(t)
    pub u: f64,
    /// Unsaturated control output before clamping
    pub u_unsat: f64,
    /// Proportional term contribution
    pub p_term: f64,
    /// Integral term contribution
    pub i_term: f64,
    /// Derivative term contribution
    pub d_term: f64,
    /// Feedforward term contribution
    pub ff_term: f64,
    /// Current error (setpoint - measurement)
    pub error: f64,
    /// Whether the output was saturated in this step
    pub is_saturated: bool,
}

/// State of the PID controller
#[derive(Debug, Clone)]
pub struct PidController {
    pub config: PidConfig,
    /// Accumulated integral state
    integral: f64,
    /// Filtered derivative state
    d_filtered: f64,
    /// Previous target/setpoint
    prev_setpoint: f64,
    /// Previous measurement y(k-1)
    prev_y: f64,
    /// Previous D-term input error
    prev_d_input: f64,
    /// Previous target velocity for acceleration feedforward
    prev_target_vel: f64,
    /// Has the controller run at least once?
    initialized: bool,
}

impl PidController {
    pub fn new(config: PidConfig) -> Self {
        Self {
            config,
            integral: 0.0,
            d_filtered: 0.0,
            prev_setpoint: 0.0,
            prev_y: 0.0,
            prev_d_input: 0.0,
            prev_target_vel: 0.0,
            initialized: false,
        }
    }

    /// Reset internal controller states
    pub fn reset(&mut self) {
        self.integral = 0.0;
        self.d_filtered = 0.0;
        self.prev_setpoint = 0.0;
        self.prev_y = 0.0;
        self.prev_d_input = 0.0;
        self.prev_target_vel = 0.0;
        self.initialized = false;
    }

    /// Update controller with setpoint r and measurement y over sample time dt
    pub fn update(&mut self, setpoint: f64, measurement: f64, dt: f64) -> PidOutput {
        if dt <= 0.0 {
            return PidOutput::default();
        }

        let raw_error = setpoint - measurement;
        // Apply deadband
        let error = if raw_error.abs() < self.config.deadband {
            0.0
        } else {
            raw_error
        };

        // Determine 2-DOF weights (b, c) based on configured form
        let (b, c) = match self.config.form {
            PidForm::Standard => (1.0, 1.0),
            PidForm::DerivativeOnMeasurement => (1.0, 0.0),
            PidForm::IPD => (0.0, 0.0),
            PidForm::TwoDegreeOfFreedom => (
                self.config.setpoint_weight_b.clamp(0.0, 1.0),
                self.config.setpoint_weight_c.clamp(0.0, 1.0),
            ),
        };

        let p_input = b * setpoint - measurement;
        let d_input = c * setpoint - measurement;

        if !self.initialized {
            self.prev_setpoint = setpoint;
            self.prev_y = measurement;
            self.prev_d_input = d_input;
            self.prev_target_vel = 0.0;
            self.initialized = true;
        }

        // 1. Proportional term
        let p_term = self.config.kp * p_input;

        // 2. Derivative term calculation (with 1st-order low-pass filter)
        let d_raw = (d_input - self.prev_d_input) / dt;
        let d_term = if self.config.filter_n > 0.0 && self.config.kd > 0.0 {
            // First-order low-pass filter: H(s) = N / (s + N), cutoff omega_c = N rad/s
            // Discrete backward Euler: D(k) = D(k-1) + alpha * (Kd * d_raw - D(k-1))
            let alpha = (self.config.filter_n * dt) / (1.0 + self.config.filter_n * dt);
            self.d_filtered += alpha * (self.config.kd * d_raw - self.d_filtered);
            self.d_filtered
        } else {
            self.config.kd * d_raw
        };

        // 3. Feedforward terms (Velocity, Acceleration, Friction)
        let target_vel = (setpoint - self.prev_setpoint) / dt;
        let target_acc = (target_vel - self.prev_target_vel) / dt;
        let ff_v = self.config.kvff * target_vel;
        let ff_a = self.config.kaff * target_acc;
        let ff_fric = if target_vel.abs() > 1e-4 {
            self.config.k_friction * target_vel.signum()
        } else {
            0.0
        };
        let ff_term = ff_v + ff_a + ff_fric;

        // 4. Candidate Integral term before saturation check
        let i_candidate = self.config.ki * self.integral;

        // Unsaturated total output
        let u_unsat = p_term + i_candidate + d_term + ff_term;

        // Saturated output
        let u_sat = u_unsat.clamp(self.config.min_output, self.config.max_output);
        let is_saturated = u_sat != u_unsat;

        // 5. Integral accumulation with Anti-Windup
        if self.config.ki > 0.0 {
            match self.config.anti_windup {
                AntiWindupMethod::None => {
                    self.integral += error * dt;
                }
                AntiWindupMethod::Clamping => {
                    // Only integrate if output is not saturated OR integration would reduce saturation
                    let is_saturating_high = u_unsat > self.config.max_output && error > 0.0;
                    let is_saturating_low = u_unsat < self.config.min_output && error < 0.0;

                    if !is_saturating_high && !is_saturating_low {
                        self.integral += error * dt;
                    }
                }
                AntiWindupMethod::BackCalculation => {
                    let tracking_error = u_sat - u_unsat;
                    self.integral += (error + (self.config.kb / self.config.ki) * tracking_error) * dt;
                }
            }
        } else {
            self.integral = 0.0;
        }

        let final_i_term = self.config.ki * self.integral;

        // Save history for next step
        self.prev_setpoint = setpoint;
        self.prev_y = measurement;
        self.prev_d_input = d_input;
        self.prev_target_vel = target_vel;

        PidOutput {
            u: u_sat,
            u_unsat,
            p_term,
            i_term: final_i_term,
            d_term,
            ff_term,
            error,
            is_saturated,
        }
    }
}
