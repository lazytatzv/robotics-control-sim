//! Kinematics modules for robotic arms and mobile platforms.

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

/// 2-Link Planar Robot Arm Kinematics
#[derive(Debug, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct Planar2LinkArm {
    pub l1: f64,
    pub l2: f64,
}

impl Default for Planar2LinkArm {
    fn default() -> Self {
        Self { l1: 1.0, l2: 1.0 }
    }
}

impl Planar2LinkArm {
    pub fn new(l1: f64, l2: f64) -> Self {
        Self { l1, l2 }
    }

    /// Forward Kinematics (FK): returns [elbow_x, elbow_y, end_effector_x, end_effector_y]
    pub fn forward_kinematics(&self, theta1: f64, theta2: f64) -> [f64; 4] {
        let x1 = self.l1 * theta1.cos();
        let y1 = self.l1 * theta1.sin();

        let x2 = x1 + self.l2 * (theta1 + theta2).cos();
        let y2 = y1 + self.l2 * (theta1 + theta2).sin();

        [x1, y1, x2, y2]
    }

    /// Inverse Kinematics (IK) analytical solution: returns Some([theta1, theta2]) or None if unreachable
    pub fn inverse_kinematics(&self, target_x: f64, target_y: f64, elbow_up: bool) -> Option<[f64; 2]> {
        let r2 = target_x * target_x + target_y * target_y;
        let l1 = self.l1;
        let l2 = self.l2;

        let cos_theta2 = (r2 - l1 * l1 - l2 * l2) / (2.0 * l1 * l2);
        if cos_theta2 < -1.0 || cos_theta2 > 1.0 {
            return None; // Target out of reach
        }

        let sin_theta2 = (1.0 - cos_theta2 * cos_theta2).max(0.0).sqrt();
        let theta2 = if elbow_up {
            -sin_theta2.atan2(cos_theta2)
        } else {
            sin_theta2.atan2(cos_theta2)
        };

        let k1 = l1 + l2 * theta2.cos();
        let k2 = l2 * theta2.sin();

        let theta1 = target_y.atan2(target_x) - k2.atan2(k1);

        Some([theta1, theta2])
    }
}
