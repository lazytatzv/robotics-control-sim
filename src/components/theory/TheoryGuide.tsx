import React from 'react';

export const TheoryGuide: React.FC = () => {
  return (
    <main style={{ gridTemplateColumns: '1fr' }}>
      <div className="card theory-content">
        <h2>📚 Control Engineering & Robotics Kinematics Reference</h2>

        <h3>1. Standard PID Controller Formulation</h3>
        <p>In continuous time, the standard parallel PID control law is formulated as:</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>u(t) = Kp * e(t) + Ki * ∫ e(τ) dτ + Kd * (de(t)/dt)</code>
        </p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
          <li>
            <strong>Proportional (P)</strong>: Produces a control action proportional to current error $e(t) = r(t) - y(t)$. Increases response speed but can leave steady-state error under friction or constant load disturbances.
          </li>
          <li>
            <strong>Integral (I)</strong>: Accumulates historical error over time. Eliminates steady-state error completely, but introduces phase lag and can cause overshoot or integrator windup.
          </li>
          <li>
            <strong>Derivative (D)</strong>: Predicts future error trend by measuring error slope. Adds damping and prevents overshoot. A low-pass filter coefficient $N$ is required in practice to prevent high-frequency noise amplification.
          </li>
        </ul>

        <h3>2. Integrator Windup & Anti-Windup Strategies</h3>
        <p>
          Physical actuators (motors, amplifiers) have finite voltage/current limits (±Umax). When the control output saturates, the integrator continues accumulating error. Once the setpoint is reached, the large accumulated charge causes extensive overshoot and severe oscillation while unwinding.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Clamping (Conditional Integration)</strong>: Freezes integrator accumulation whenever the output is saturated and the error sign would drive the output further into saturation.
        </p>

        <h3>3. Setpoint Kick Prevention (PI-D & I-PD)</h3>
        <p>
          When the setpoint $r(t)$ changes abruptly (step input), taking the direct derivative of error $de/dt$ produces an impulse spike ("derivative kick").
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>PI-D</strong> computes the derivative term exclusively from output velocity <code>-Kd * (dy/dt)</code>, eliminating derivative spikes entirely while retaining disturbance rejection.
        </p>

        <h3>4. 2-Link Planar Robot Arm Inverse Kinematics (IK)</h3>
        <p>Analytical geometric solution from end-effector Cartesian target $(x, y)$ to joint angles $(\theta_1, \theta_2)$:</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>cos(θ2) = (x^2 + y^2 - L1^2 - L2^2) / (2 * L1 * L2)</code>
        </p>
        <p>
          The law of cosines yields two valid configurations: <strong>Elbow-Up</strong> and <strong>Elbow-Down</strong>. If the target distance $\sqrt{'{'}x^2 + y^2{'}'} &gt; L_1 + L_2$, the target lies outside the reachable workspace (singularity).
        </p>
      </div>
    </main>
  );
};
