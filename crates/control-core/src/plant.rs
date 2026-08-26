//! Dynamic physical plant models.

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

use crate::integrator::rk4_step;

/// DC Motor Model Parameters
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct DcMotorParams {
    /// Rotor moment of inertia J [kg*m^2]
    pub j: f64,
    /// Viscous damping coefficient B [N*m*s/rad]
    pub b: f64,
    /// Torque constant Kt [N*m/A]
    pub kt: f64,
    /// Back-EMF constant Ke [V*s/rad]
    pub ke: f64,
    /// Armature resistance R [Ohm]
    pub r: f64,
    /// Armature inductance L [H] (if 0.0, simplified electromechanical model is used)
    pub l: f64,
    /// Coulomb friction torque [N*m]
    pub coulomb_friction: f64,
}

impl Default for DcMotorParams {
    fn default() -> Self {
        Self {
            j: 0.01,
            b: 0.1,
            kt: 0.05,
            ke: 0.05,
            r: 1.0,
            l: 0.005,
            coulomb_friction: 0.001,
        }
    }
}

/// DC Motor Physical Plant
/// State: [theta (rad), omega (rad/s), current (A)]
#[derive(Debug, Clone)]
pub struct DcMotorPlant {
    pub params: DcMotorParams,
    pub state: [f64; 3], // [theta, omega, current]
}

impl DcMotorPlant {
    pub fn new(params: DcMotorParams) -> Self {
        Self {
            params,
            state: [0.0, 0.0, 0.0],
        }
    }

    pub fn reset(&mut self) {
        self.state = [0.0, 0.0, 0.0];
    }

    /// Step simulation with input voltage u [V] and external disturbance torque tau_dist [N*m]
    pub fn step(&mut self, voltage: f64, tau_dist: f64, dt: f64) {
        let p = &self.params;
        let ode = |_t: f64, x: &[f64; 3], v: f64| -> [f64; 3] {
            let _theta = x[0];
            let omega = x[1];
            let current = x[2];

            // Coulomb friction
            let friction_coulomb = if omega.abs() > 1e-4 {
                p.coulomb_friction * omega.signum()
            } else {
                0.0
            };

            // d(theta)/dt = omega
            let d_theta = omega;

            // d(omega)/dt = (Kt * current - B * omega - friction_coulomb - tau_dist) / J
            let torque_motor = p.kt * current;
            let d_omega = (torque_motor - p.b * omega - friction_coulomb - tau_dist) / p.j;

            // d(current)/dt = (V - R * current - Ke * omega) / L
            let d_current = if p.l > 1e-6 {
                (v - p.r * current - p.ke * omega) / p.l
            } else {
                0.0
            };

            [d_theta, d_omega, d_current]
        };

        if p.l > 1e-6 {
            self.state = rk4_step(ode, 0.0, &self.state, voltage, dt);
        } else {
            let current = (voltage - p.ke * self.state[1]) / p.r;
            self.state[2] = current;
            let ode_mech = |_t: f64, x: &[f64; 2], v: f64| -> [f64; 2] {
                let omega = x[1];
                let i = (v - p.ke * omega) / p.r;
                let d_theta = omega;
                let d_omega = (p.kt * i - p.b * omega - tau_dist) / p.j;
                [d_theta, d_omega]
            };
            let mech_state = [self.state[0], self.state[1]];
            let next_mech = rk4_step(ode_mech, 0.0, &mech_state, voltage, dt);
            self.state[0] = next_mech[0];
            self.state[1] = next_mech[1];
        }
    }

    pub fn angle(&self) -> f64 {
        self.state[0]
    }

    pub fn velocity(&self) -> f64 {
        self.state[1]
    }

    pub fn current(&self) -> f64 {
        self.state[2]
    }
}

/// Mass-Spring-Damper (Cart System) Parameters
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct MassSpringDamperParams {
    /// Mass m [kg]
    pub mass: f64,
    /// Damping coefficient c [N*s/m]
    pub damping: f64,
    /// Spring stiffness k [N/m]
    pub stiffness: f64,
    /// Static friction force [N]
    pub friction: f64,
}

impl Default for MassSpringDamperParams {
    fn default() -> Self {
        Self {
            mass: 1.0,
            damping: 0.5,
            stiffness: 2.0,
            friction: 0.005,
        }
    }
}

/// Mass-Spring-Damper Plant
/// State: [position (m), velocity (m/s)]
#[derive(Debug, Clone)]
pub struct MassSpringDamperPlant {
    pub params: MassSpringDamperParams,
    pub state: [f64; 2],
}

impl MassSpringDamperPlant {
    pub fn new(params: MassSpringDamperParams) -> Self {
        Self {
            params,
            state: [0.0, 0.0],
        }
    }

    pub fn reset(&mut self) {
        self.state = [0.0, 0.0];
    }

    pub fn step(&mut self, force: f64, dist_force: f64, dt: f64) {
        let p = &self.params;
        let ode = |_t: f64, x: &[f64; 2], f_total: f64| -> [f64; 2] {
            let pos = x[0];
            let vel = x[1];

            let f_fric = if vel.abs() > 1e-4 {
                p.friction * vel.signum()
            } else {
                0.0
            };

            let d_pos = vel;
            let d_vel = (f_total - p.damping * vel - p.stiffness * pos - f_fric) / p.mass;

            [d_pos, d_vel]
        };

        self.state = rk4_step(ode, 0.0, &self.state, force + dist_force, dt);
    }

    pub fn position(&self) -> f64 {
        self.state[0]
    }

    pub fn velocity(&self) -> f64 {
        self.state[1]
    }
}
