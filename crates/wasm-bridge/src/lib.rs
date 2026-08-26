use control_core::{
    analysis::{
        compute_bode_analysis, eval_motor_position_tf, eval_motor_velocity_tf, eval_msd_tf,
        tune_dc_motor, AutoTuneMethod,
    },
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
    pub ff_term: f64,
    pub is_saturated: bool,
    pub current: f64,
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
            "2dof" => PidForm::TwoDegreeOfFreedom,
            _ => PidForm::Standard,
        };

        self.pid.config.kp = kp;
        self.pid.config.ki = ki;
        self.pid.config.kd = kd;
        self.pid.config.filter_n = filter_n;
        self.pid.config.min_output = min_output;
        self.pid.config.max_output = max_output;
        self.pid.config.anti_windup = anti_windup;
        self.pid.config.kb = kb;
        self.pid.config.form = form;
    }

    pub fn configure_pid_advanced(
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
        setpoint_weight_b: f64,
        setpoint_weight_c: f64,
        kvff: f64,
        kaff: f64,
        k_friction: f64,
        deadband: f64,
    ) {
        self.configure_pid(
            kp,
            ki,
            kd,
            filter_n,
            min_output,
            max_output,
            anti_windup_str,
            form_str,
            kb,
        );
        self.pid.config.setpoint_weight_b = setpoint_weight_b;
        self.pid.config.setpoint_weight_c = setpoint_weight_c;
        self.pid.config.kvff = kvff;
        self.pid.config.kaff = kaff;
        self.pid.config.k_friction = k_friction;
        self.pid.config.deadband = deadband;
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
        gear_ratio: f64,
    ) {
        self.motor.params = DcMotorParams {
            j,
            b,
            kt,
            ke,
            r,
            l,
            coulomb_friction,
            gear_ratio,
        };
    }

    pub fn configure_msd(&mut self, mass: f64, damping: f64, stiffness: f64, friction: f64) {
        self.msd.params = MassSpringDamperParams {
            mass,
            damping,
            stiffness,
            friction,
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
            ff_term: pid_out.ff_term,
            is_saturated: pid_out.is_saturated,
            current: self.motor.current(),
        };

        serde_wasm_bindgen::to_value(&data).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Simulate full trajectory instantly in Rust
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
                ff_term: pid_out.ff_term,
                is_saturated: pid_out.is_saturated,
                current: self.motor.current(),
            });
        }

        serde_wasm_bindgen::to_value(&history).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Compute frequency response Bode analysis
    pub fn get_bode_analysis(&self) -> Result<JsValue, JsValue> {
        let motor_p = self.motor.params.clone();
        let msd_p = self.msd.params.clone();

        let analysis = match self.plant_type {
            PlantType::DcMotorPosition => {
                compute_bode_analysis(|w| eval_motor_position_tf(&motor_p, w), &self.pid.config)
            }
            PlantType::DcMotorVelocity => {
                compute_bode_analysis(|w| eval_motor_velocity_tf(&motor_p, w), &self.pid.config)
            }
            PlantType::MassSpringDamper => {
                compute_bode_analysis(|w| eval_msd_tf(&msd_p, w), &self.pid.config)
            }
        };

        serde_wasm_bindgen::to_value(&analysis).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Compute suggested gains from Auto-Tuning algorithms
    pub fn get_auto_tuned_gains(&self, method_str: &str) -> Result<JsValue, JsValue> {
        let method = match method_str {
            "chr0" => AutoTuneMethod::ChienHronesReswick0,
            "chr20" => AutoTuneMethod::ChienHronesReswick20,
            "pole_fast" => AutoTuneMethod::PolePlacementFast,
            "pole_smooth" => AutoTuneMethod::PolePlacementSmooth,
            _ => AutoTuneMethod::ZieglerNichols,
        };

        let tuned = tune_dc_motor(&self.motor.params, method);
        serde_wasm_bindgen::to_value(&tuned).map_err(|e| JsValue::from_str(&e.to_string()))
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
