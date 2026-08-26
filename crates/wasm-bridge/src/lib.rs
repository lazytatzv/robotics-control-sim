use control_core::{
    AntiWindupMethod, DcMotorParams, DcMotorPlant, MassSpringDamperParams, MassSpringDamperPlant,
    PidConfig, PidController, PidForm, Planar2LinkArm,
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StepDataPoint {
    pub t: f64,
    pub setpoint: f64,
    pub actual: f64,
    pub velocity: f64,
    pub error: f64,
    pub u: f64,
    pub p_term: f64,
    pub i_term: f64,
    pub d_term: f64,
    pub is_saturated: bool,
    pub current: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct Metrics {
    pub rise_time: Option<f64>,
    pub overshoot_percent: f64,
    pub settling_time: Option<f64>,
    pub steady_state_error: f64,
    pub peak_value: f64,
    pub is_stable: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum PlantType {
    DcMotorPosition,
    DcMotorVelocity,
    MassSpringDamper,
}

#[wasm_bindgen]
pub struct Simulator {
    pid: PidController,
    motor: DcMotorPlant,
    msd: MassSpringDamperPlant,
    plant_type: PlantType,
    time: f64,
}

#[wasm_bindgen]
impl Simulator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            pid: PidController::new(PidConfig::default()),
            motor: DcMotorPlant::new(DcMotorParams::default()),
            msd: MassSpringDamperPlant::new(MassSpringDamperParams::default()),
            plant_type: PlantType::DcMotorPosition,
            time: 0.0,
        }
    }

    pub fn set_plant_type(&mut self, plant_type_str: &str) {
        self.plant_type = match plant_type_str {
            "motor_velocity" => PlantType::DcMotorVelocity,
            "cart" | "mass_spring_damper" => PlantType::MassSpringDamper,
            _ => PlantType::DcMotorPosition,
        };
        self.reset();
    }

    pub fn configure_pid(
        &mut self,
        kp: f64,
        ki: f64,
        kd: f64,
        filter_n: f64,
        min_output: f64,
        max_output: f64,
        anti_windup_str: &str,
        form_str: &str,
        kb: f64,
    ) {
        let anti_windup = match anti_windup_str {
            "none" => AntiWindupMethod::None,
            "back_calc" => AntiWindupMethod::BackCalculation,
            _ => AntiWindupMethod::Clamping,
        };

        let form = match form_str {
            "pi_d" => PidForm::DerivativeOnMeasurement,
            "i_pd" => PidForm::IPD,
            _ => PidForm::Standard,
        };

        self.pid.config = PidConfig {
            kp,
            ki,
            kd,
            filter_n,
            min_output,
            max_output,
            anti_windup,
            kb,
            form,
        };
    }

    pub fn configure_motor(
        &mut self,
        j: f64,
        b: f64,
        kt: f64,
        ke: f64,
        r: f64,
        l: f64,
        coulomb_friction: f64,
    ) {
        self.motor.params = DcMotorParams {
            j,
            b,
            kt,
            ke,
            r,
            l,
            coulomb_friction,
        };
    }

    pub fn reset(&mut self) {
        self.pid.reset();
        self.motor.reset();
        self.msd.reset();
        self.time = 0.0;
    }

    /// Run a single step of simulation and return data point
    pub fn step(
        &mut self,
        dt: f64,
        setpoint: f64,
        disturbance: f64,
        noise_amplitude: f64,
    ) -> Result<JsValue, JsValue> {
        let actual = match self.plant_type {
            PlantType::DcMotorPosition => self.motor.angle(),
            PlantType::DcMotorVelocity => self.motor.velocity(),
            PlantType::MassSpringDamper => self.msd.position(),
        };

        // Add sensor noise
        let noise = if noise_amplitude > 0.0 {
            (js_sys::Math::random() * 2.0 - 1.0) * noise_amplitude
        } else {
            0.0
        };
        let measured = actual + noise;

        let pid_out = self.pid.update(setpoint, measured, dt);

        match self.plant_type {
            PlantType::DcMotorPosition | PlantType::DcMotorVelocity => {
                self.motor.step(pid_out.u, disturbance, dt);
            }
            PlantType::MassSpringDamper => {
                self.msd.step(pid_out.u, disturbance, dt);
            }
        }

        self.time += dt;

        let data = StepDataPoint {
            t: self.time,
            setpoint,
            actual,
            velocity: match self.plant_type {
                PlantType::DcMotorPosition | PlantType::DcMotorVelocity => self.motor.velocity(),
                PlantType::MassSpringDamper => self.msd.velocity(),
            },
            error: pid_out.error,
            u: pid_out.u,
            p_term: pid_out.p_term,
            i_term: pid_out.i_term,
            d_term: pid_out.d_term,
            is_saturated: pid_out.is_saturated,
            current: self.motor.current(),
        };

        serde_wasm_bindgen::to_value(&data).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Simulate full trajectory instantly in Rust (e.g. 5~10s step response)
    pub fn run_batch(
        &mut self,
        duration: f64,
        dt: f64,
        setpoint: f64,
        disturbance: f64,
        dist_start_time: f64,
        noise_amplitude: f64,
    ) -> Result<JsValue, JsValue> {
        self.reset();
        let steps = (duration / dt).ceil() as usize;
        let mut history = Vec::with_capacity(steps);

        for _ in 0..steps {
            let dist = if self.time >= dist_start_time {
                disturbance
            } else {
                0.0
            };

            let actual = match self.plant_type {
                PlantType::DcMotorPosition => self.motor.angle(),
                PlantType::DcMotorVelocity => self.motor.velocity(),
                PlantType::MassSpringDamper => self.msd.position(),
            };

            let noise = if noise_amplitude > 0.0 {
                (js_sys::Math::random() * 2.0 - 1.0) * noise_amplitude
            } else {
                0.0
            };
            let measured = actual + noise;

            let pid_out = self.pid.update(setpoint, measured, dt);

            match self.plant_type {
                PlantType::DcMotorPosition | PlantType::DcMotorVelocity => {
                    self.motor.step(pid_out.u, dist, dt);
                }
                PlantType::MassSpringDamper => {
                    self.msd.step(pid_out.u, dist, dt);
                }
            }

            self.time += dt;

            history.push(StepDataPoint {
                t: self.time,
                setpoint,
                actual,
                velocity: match self.plant_type {
                    PlantType::DcMotorPosition | PlantType::DcMotorVelocity => self.motor.velocity(),
                    PlantType::MassSpringDamper => self.msd.velocity(),
                },
                error: pid_out.error,
                u: pid_out.u,
                p_term: pid_out.p_term,
                i_term: pid_out.i_term,
                d_term: pid_out.d_term,
                is_saturated: pid_out.is_saturated,
                current: self.motor.current(),
            });
        }

        serde_wasm_bindgen::to_value(&history).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Standalone Kinematics calculation functions for 2-Link Arm
#[wasm_bindgen]
pub fn arm2_fk(l1: f64, l2: f64, theta1: f64, theta2: f64) -> Result<JsValue, JsValue> {
    let arm = Planar2LinkArm::new(l1, l2);
    let pts = arm.forward_kinematics(theta1, theta2);
    serde_wasm_bindgen::to_value(&pts).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn arm2_ik(l1: f64, l2: f64, x: f64, y: f64, elbow_up: bool) -> Result<JsValue, JsValue> {
    let arm = Planar2LinkArm::new(l1, l2);
    let angles = arm.inverse_kinematics(x, y, elbow_up);
    serde_wasm_bindgen::to_value(&angles).map_err(|e| JsValue::from_str(&e.to_string()))
}
