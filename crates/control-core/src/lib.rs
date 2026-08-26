//! High-performance Robotics and Control Theory Engine in Rust.

pub mod integrator;
pub mod pid;
pub mod plant;
pub mod kinematics;
pub mod analysis;

pub use integrator::*;
pub use pid::*;
pub use plant::*;
pub use kinematics::*;
pub use analysis::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pid_basic_step() {
        let config = PidConfig {
            kp: 2.0,
            ki: 1.0,
            kd: 0.1,
            ..Default::default()
        };
        let mut pid = PidController::new(config);
        let out = pid.update(1.0, 0.0, 0.01);
        assert!(out.u > 0.0);
        assert_eq!(out.p_term, 2.0);
    }

    #[test]
    fn test_motor_rk4_step() {
        let params = DcMotorParams::default();
        let mut motor = DcMotorPlant::new(params);
        motor.step(12.0, 0.0, 0.001);
        assert!(motor.velocity() > 0.0 || motor.current() > 0.0);
    }

    #[test]
    fn test_arm_fk_ik() {
        let arm = Planar2LinkArm::new(1.0, 1.0);
        let [x1, y1, x2, y2] = arm.forward_kinematics(0.5, 0.5);
        let ik = arm.inverse_kinematics(x2, y2, false);
        assert!(ik.is_some());
    }
}
