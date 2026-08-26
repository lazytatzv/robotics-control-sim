//! Frequency-domain and stability analysis algorithms.
//!
//! Provides Bode plot computation, Gain & Phase Margin extraction,
//! Pole-Zero evaluation, and Classical/Modern PID Auto-Tuning rules.

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

use crate::pid::PidConfig;
use crate::plant::{DcMotorParams, MassSpringDamperParams};

/// Complex number structure for frequency response evaluation
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Complex {
    pub re: f64,
    pub im: f64,
}

impl Complex {
    pub fn new(re: f64, im: f64) -> Self {
        Self { re, im }
    }

    pub fn magnitude(&self) -> f64 {
        (self.re * self.re + self.im * self.im).sqrt()
    }

    pub fn phase_rad(&self) -> f64 {
        self.im.atan2(self.re)
    }

    pub fn phase_deg(&self) -> f64 {
        self.phase_rad().to_degrees()
    }

    pub fn add(&self, other: Complex) -> Complex {
        Complex::new(self.re + other.re, self.im + other.im)
    }

    pub fn sub(&self, other: Complex) -> Complex {
        Complex::new(self.re - other.re, self.im - other.im)
    }

    pub fn mul(&self, other: Complex) -> Complex {
        Complex::new(
            self.re * other.re - self.im * other.im,
            self.re * other.im + self.im * other.re,
        )
    }

    pub fn div(&self, other: Complex) -> Complex {
        let denom = other.re * other.re + other.im * other.im;
        if denom < 1e-18 {
            return Complex::new(0.0, 0.0);
        }
        Complex::new(
            (self.re * other.re + self.im * other.im) / denom,
            (self.im * other.re - self.re * other.im) / denom,
        )
    }
}

/// Single frequency point on Bode plot
#[derive(Debug, Clone, Copy)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct BodePoint {
    pub omega: f64,
    pub mag_db: f64,
    pub phase_deg: f64,
    pub closed_loop_mag_db: f64,
}

/// Bode analysis summary containing stability margins
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct BodeAnalysis {
    pub points: Vec<BodePoint>,
    pub gain_crossover_freq: Option<f64>, // omega_gc where |L| = 0 dB
    pub phase_margin_deg: Option<f64>,    // PM = 180 + phase(omega_gc)
    pub phase_crossover_freq: Option<f64>,// omega_pc where phase = -180 deg
    pub gain_margin_db: Option<f64>,      // GM = -20log10(|L(omega_pc)|)
    pub is_stable: bool,
    pub bandwidth: Option<f64>,           // -3dB closed-loop bandwidth
}

/// Pole or Zero on complex s-plane
#[derive(Debug, Clone, Copy)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct ComplexRoot {
    pub re: f64,
    pub im: f64,
    pub natural_freq: f64, // wn = |s|
    pub damping_ratio: f64, // zeta = -re / |s|
}

/// Pole-Zero Map
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct PoleZeroMap {
    pub open_loop_poles: Vec<ComplexRoot>,
    pub open_loop_zeros: Vec<ComplexRoot>,
    pub closed_loop_poles: Vec<ComplexRoot>,
}

/// Evaluate PID controller transfer function C(s) at s = j*omega
/// C(s) = Kp + Ki/s + (Kd * s) / (1 + s/N)
pub fn eval_pid_tf(config: &PidConfig, omega: f64) -> Complex {
    if omega <= 1e-6 {
        return Complex::new(config.kp, 0.0);
    }

    // s = j * omega
    let kp_comp = Complex::new(config.kp, 0.0);

    // Ki / s = Ki / (j * omega) = -j * (Ki / omega)
    let ki_comp = Complex::new(0.0, -config.ki / omega);

    // Kd * s / (1 + s/N) = (j * Kd * omega) / (1 + j * omega / N)
    let kd_comp = if config.filter_n > 0.0 && config.kd > 0.0 {
        let num = Complex::new(0.0, config.kd * omega);
        let denom = Complex::new(1.0, omega / config.filter_n);
        num.div(denom)
    } else {
        Complex::new(0.0, config.kd * omega)
    };

    kp_comp.add(ki_comp).add(kd_comp)
}

/// Evaluate DC Motor plant transfer function P(s) at s = j*omega
/// P(s) = Theta(s) / V(s) = (Kt / N_gear) / (s * [ (L*s + R)*(J*s + B) + Kt*Ke ])
pub fn eval_motor_position_tf(params: &DcMotorParams, omega: f64) -> Complex {
    if omega <= 1e-6 {
        return Complex::new(0.0, -1e6);
    }
    let s = Complex::new(0.0, omega);
    let n_gear = params.gear_ratio.max(1e-4);

    // (L*s + R)
    let elec = Complex::new(params.r, params.l * omega);
    // (J*s + B)
    let mech = Complex::new(params.b, params.j * omega);
    // (L*s + R)*(J*s + B) + Kt*Ke
    let kt_ke = Complex::new(params.kt * params.ke, 0.0);
    let poly = elec.mul(mech).add(kt_ke);

    // s * poly
    let denom = s.mul(poly);
    let num = Complex::new(params.kt / n_gear, 0.0);

    num.div(denom)
}

/// Evaluate DC Motor velocity transfer function P(s) = Omega(s) / V(s)
pub fn eval_motor_velocity_tf(params: &DcMotorParams, omega: f64) -> Complex {
    let n_gear = params.gear_ratio.max(1e-4);
    let elec = Complex::new(params.r, params.l * omega);
    let mech = Complex::new(params.b, params.j * omega);
    let kt_ke = Complex::new(params.kt * params.ke, 0.0);
    let denom = elec.mul(mech).add(kt_ke);
    let num = Complex::new(params.kt / n_gear, 0.0);

    num.div(denom)
}

/// Evaluate Mass-Spring-Damper transfer function P(s) = X(s) / F(s) = 1 / (m*s^2 + c*s + k)
pub fn eval_msd_tf(params: &MassSpringDamperParams, omega: f64) -> Complex {
    // m*(j*omega)^2 + c*(j*omega) + k = (k - m*omega^2) + j*(c*omega)
    let re = params.stiffness - params.mass * omega * omega;
    let im = params.damping * omega;
    let denom = Complex::new(re, im);
    let num = Complex::new(1.0, 0.0);

    num.div(denom)
}

/// Compute full frequency response and stability margins for a plant & PID configuration
pub fn compute_bode_analysis<F>(eval_plant: F, pid: &PidConfig) -> BodeAnalysis
where
    F: Fn(f64) -> Complex,
{
    // Frequency range: 0.1 rad/s to 1000 rad/s logarithmically spaced (200 points)
    let num_points = 250;
    let omega_min: f64 = 0.05;
    let omega_max: f64 = 2000.0;
    let log_min = omega_min.ln();
    let log_max = omega_max.ln();
    let step = (log_max - log_min) / (num_points as f64 - 1.0);

    let mut points = Vec::with_capacity(num_points);
    let mut prev_open_loop: Option<(f64, Complex, f64, f64)> = None;

    let mut gain_crossover_freq = None;
    let mut phase_margin_deg = None;
    let mut phase_crossover_freq = None;
    let mut gain_margin_db = None;
    let mut bandwidth = None;

    for i in 0..num_points {
        let omega = (log_min + i as f64 * step).exp();
        let c = eval_pid_tf(pid, omega);
        let p = eval_plant(omega);
        let open_loop = c.mul(p);

        let mag = open_loop.magnitude();
        let mag_db = if mag > 1e-12 { 20.0 * mag.log10() } else { -240.0 };
        
        let mut phase_deg = open_loop.phase_deg();
        // Unwrap phase so it is continuous
        if phase_deg > 0.0 {
            phase_deg -= 360.0;
        }

        // Closed loop T(s) = L(s) / (1 + L(s))
        let one_plus_l = Complex::new(1.0, 0.0).add(open_loop);
        let closed_loop = open_loop.div(one_plus_l);
        let cl_mag = closed_loop.magnitude();
        let cl_mag_db = if cl_mag > 1e-12 { 20.0 * cl_mag.log10() } else { -240.0 };

        if bandwidth.is_none() && cl_mag_db <= -3.0 && i > 0 {
            bandwidth = Some(omega);
        }

        // Check for Gain Crossover (mag_db crosses 0 dB from positive to negative)
        if let Some((prev_w, _prev_ol, prev_db, prev_phase)) = prev_open_loop {
            if gain_crossover_freq.is_none() && ((prev_db >= 0.0 && mag_db <= 0.0) || (prev_db <= 0.0 && mag_db >= 0.0)) {
                let frac = (0.0 - prev_db) / (mag_db - prev_db + 1e-12);
                let w_gc = (prev_w.ln() + frac * (omega.ln() - prev_w.ln())).exp();
                let pm = prev_phase + frac * (phase_deg - prev_phase) + 180.0;
                gain_crossover_freq = Some(w_gc);
                phase_margin_deg = Some(pm);
            }

            // Check for Phase Crossover (phase crosses -180 deg)
            if phase_crossover_freq.is_none() && ((prev_phase >= -180.0 && phase_deg <= -180.0) || (prev_phase <= -180.0 && phase_deg >= -180.0)) {
                let frac = (-180.0 - prev_phase) / (phase_deg - prev_phase + 1e-12);
                let w_pc = (prev_w.ln() + frac * (omega.ln() - prev_w.ln())).exp();
                let gm_db = -(prev_db + frac * (mag_db - prev_db));
                phase_crossover_freq = Some(w_pc);
                gain_margin_db = Some(gm_db);
            }
        }

        prev_open_loop = Some((omega, open_loop, mag_db, phase_deg));

        points.push(BodePoint {
            omega,
            mag_db,
            phase_deg,
            closed_loop_mag_db: cl_mag_db,
        });
    }

    let is_stable = match (phase_margin_deg, gain_margin_db) {
        (Some(pm), Some(gm)) => pm > 0.0 && gm > 0.0,
        (Some(pm), None) => pm > 0.0,
        _ => true,
    };

    BodeAnalysis {
        points,
        gain_crossover_freq,
        phase_margin_deg,
        phase_crossover_freq,
        gain_margin_db,
        is_stable,
        bandwidth,
    }
}

/// Auto-tuning algorithm selection
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub enum AutoTuneMethod {
    ZieglerNichols,
    ChienHronesReswick0,
    ChienHronesReswick20,
    PolePlacementFast,
    PolePlacementSmooth,
}

/// Suggested PID gains from auto-tuning
#[derive(Debug, Clone, Copy)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct TunedGains {
    pub kp: f64,
    pub ki: f64,
    pub kd: f64,
    pub filter_n: f64,
    pub method_name: &'static str,
}

/// Compute optimal PID gains based on motor parameters and tuning rules
pub fn tune_dc_motor(params: &DcMotorParams, method: AutoTuneMethod) -> TunedGains {
    let j = params.j;
    let b = params.b;
    let kt = params.kt;
    let ke = params.ke;
    let r = params.r;

    // Effective motor damping B_eff = B + (Kt * Ke)/R
    let b_eff = b + (kt * ke) / r;
    // Motor mechanical gain K_m = Kt / (R * B_eff)
    let k_m = kt / (r * b_eff);
    // Motor mechanical time constant Tau_m = J / B_eff
    let tau_m = j / b_eff;

    match method {
        AutoTuneMethod::ZieglerNichols => {
            // Z-N step response based on effective first order model + apparent delay
            let delay = 0.02; // estimated typical loop / electrical delay
            let a = k_m * delay / tau_m;
            let kp = (1.2 / a).clamp(0.5, 40.0);
            let ki = (kp / (2.0 * delay)).clamp(0.0, 30.0);
            let kd = (kp * 0.5 * delay).clamp(0.0, 5.0);
            TunedGains {
                kp,
                ki,
                kd,
                filter_n: 30.0,
                method_name: "Ziegler-Nichols (Standard)",
            }
        }
        AutoTuneMethod::ChienHronesReswick0 => {
            // CHR 0% Overshoot for setpoint tracking
            let delay = 0.02;
            let a = k_m * delay / tau_m;
            let kp = (0.6 / a).clamp(0.5, 30.0);
            let ki = (kp / tau_m).clamp(0.0, 20.0);
            let kd = (kp * 0.5 * delay).clamp(0.0, 4.0);
            TunedGains {
                kp,
                ki,
                kd,
                filter_n: 25.0,
                method_name: "Chien-Hrones-Reswick (0% Overshoot)",
            }
        }
        AutoTuneMethod::ChienHronesReswick20 => {
            // CHR 20% Overshoot (Faster response)
            let delay = 0.02;
            let a = k_m * delay / tau_m;
            let kp = (0.95 / a).clamp(0.5, 35.0);
            let ki = (kp / (1.4 * tau_m)).clamp(0.0, 25.0);
            let kd = (kp * 0.47 * delay).clamp(0.0, 5.0);
            TunedGains {
                kp,
                ki,
                kd,
                filter_n: 30.0,
                method_name: "Chien-Hrones-Reswick (20% Overshoot)",
            }
        }
        AutoTuneMethod::PolePlacementSmooth => {
            // Target: Critically damped zeta = 1.0, wn = 25 rad/s
            let wn = 25.0;
            let zeta = 1.0;
            // 2 * zeta * wn * J = B_eff + (Kt / R) * Kd => Kd
            let kd = ((2.0 * zeta * wn * j - b_eff) * (r / kt)).max(0.01);
            let kp = ((wn * wn * j) * (r / kt)).max(0.5);
            let ki = (kp * (wn / 4.0)).min(30.0);
            TunedGains {
                kp,
                ki,
                kd,
                filter_n: 35.0,
                method_name: "Pole Placement (Smooth, Critically Damped)",
            }
        }
        AutoTuneMethod::PolePlacementFast => {
            // Target: Fast response wn = 45 rad/s, zeta = 0.707 (optimal Butterworth damping)
            let wn = 45.0;
            let zeta = 0.707;
            let kd = ((2.0 * zeta * wn * j - b_eff) * (r / kt)).max(0.01);
            let kp = ((wn * wn * j) * (r / kt)).max(0.5);
            let ki = (kp * (wn / 3.5)).min(35.0);
            TunedGains {
                kp,
                ki,
                kd,
                filter_n: 40.0,
                method_name: "Pole Placement (High-Bandwidth, Butterworth)",
            }
        }
    }
}
