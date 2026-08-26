//! Professional-grade discrete PID controller implementation.
//! 
//! Supports standard PID, I-PD, PI-D, Low-pass filtered derivative,
//! Anti-windup (Clamping & Back-calculation), and saturation limits.

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
    /// Standard PID: Error fed to P, I, and D
    Standard,
    /// PI-D (Derivative on Measurement): Derivative calculated from -dy/dt to avoid setpoint kicks
    DerivativeOnMeasurement,
    /// I-PD: Both P and D act on measurement, only I acts on error
    IPD,
}

/// Configuration parameters for PID controller
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct PidConfig {
    pub kp: f64,
    pub ki: f64,
    pub kd: f64,
    /// Derivative low-pass filter coefficient N (cutoff freq approx N * Kd / Kp or N/tau)
    /// Typical range: 5.0 to 20.0. If 0.0 or <= 0, no filter is applied.
    pub filter_n: f64,
    /// Minimum output limit (saturation)
    pub min_output: f64,
    /// Maximum output limit (saturation)
    pub max_output: f64,
    /// Anti-windup method
    pub anti_windup: AntiWindupMethod,
    /// Back-calculation tracking gain Kb (if BackCalculation is used)
    pub kb: f64,
    /// Form of PID (Standard, PI-D, I-PD)
    pub form: PidForm,
}

impl Default for PidConfig {
    fn default() -> Self {
        Self {
            kp: 1.0,
            ki: 0.0,
            kd: 0.0,
            filter_n: 10.0,
            min_output: -12.0,
            max_output: 12.0,
            anti_windup: AntiWindupMethod::Clamping,
            kb: 1.0,
            form: PidForm::Standard,
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
    /// Previous measurement y(k-1)
    prev_y: f64,
    /// Previous error e(k-1)
    prev_error: f64,
    /// Has the controller run at least once?
    initialized: bool,
}

impl PidController {
    pub fn new(config: PidConfig) -> Self {
        Self {
            config,
            integral: 0.0,
            d_filtered: 0.0,
            prev_y: 0.0,
            prev_error: 0.0,
            initialized: false,
        }
    }

    /// Reset internal controller states
    pub fn reset(&mut self) {
        self.integral = 0.0;
        self.d_filtered = 0.0;
        self.prev_y = 0.0;
        self.prev_error = 0.0;
        self.initialized = false;
    }

    /// Update controller with setpoint r and measurement y over sample time dt
    pub fn update(&mut self, setpoint: f64, measurement: f64, dt: f64) -> PidOutput {
        if dt <= 0.0 {
            return PidOutput::default();
        }

        let error = setpoint - measurement;

        if !self.initialized {
            self.prev_y = measurement;
            self.prev_error = error;
            self.initialized = true;
        }

        // 1. Proportional term
        let p_term = match self.config.form {
            PidForm::Standard | PidForm::DerivativeOnMeasurement => self.config.kp * error,
            PidForm::IPD => -self.config.kp * measurement,
        };

        // 2. Derivative term calculation
        let d_raw = match self.config.form {
            PidForm::Standard => (error - self.prev_error) / dt,
            PidForm::DerivativeOnMeasurement | PidForm::IPD => -(measurement - self.prev_y) / dt,
        };

        // Apply derivative filter if filter_n > 0
        let d_term = if self.config.filter_n > 0.0 && self.config.kd > 0.0 {
            // First-order low-pass filter on D term:
            // D(k) = (Kd * N * d_raw + D(k-1)) / (1 + N * dt)
            let alpha = (self.config.filter_n * dt) / (1.0 + self.config.filter_n * dt);
            self.d_filtered = self.d_filtered + alpha * (self.config.kd * self.config.filter_n * d_raw - self.d_filtered);
            self.d_filtered
        } else {
            self.config.kd * d_raw
        };

        // 3. Candidate Integral term before saturation update
        let i_candidate = self.config.ki * self.integral;

        // Unsaturated total output
        let u_unsat = p_term + i_candidate + d_term;

        // Saturated output
        let u_sat = u_unsat.clamp(self.config.min_output, self.config.max_output);
        let is_saturated = u_sat != u_unsat;

        // 4. Integral accumulation with Anti-Windup
        match self.config.anti_windup {
            AntiWindupMethod::None => {
                // No anti-windup: unconditionally integrate error
                self.integral += error * dt;
            }
            AntiWindupMethod::Clamping => {
                // Clamping: Only integrate if not saturated OR if integrating would drive output away from saturation
                let is_saturating_high = u_unsat > self.config.max_output && error > 0.0;
                let is_saturating_low = u_unsat < self.config.min_output && error < 0.0;

                if !is_saturating_high && !is_saturating_low {
                    self.integral += error * dt;
                }
            }
            AntiWindupMethod::BackCalculation => {
                // Back-calculation: Integrator state updated with tracking error (u_sat - u_unsat)
                let tracking_error = u_sat - u_unsat;
                self.integral += (error + (self.config.kb / (self.config.ki.max(1e-6))) * tracking_error) * dt;
            }
        }

        let final_i_term = self.config.ki * self.integral;

        // Save history for next step
        self.prev_y = measurement;
        self.prev_error = error;

        PidOutput {
            u: u_sat,
            u_unsat,
            p_term,
            i_term: final_i_term,
            d_term,
            error,
            is_saturated,
        }
    }
}
