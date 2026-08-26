import React from 'react';

export const TheoryGuide: React.FC = () => {
  return (
    <main style={{ gridTemplateColumns: '1fr', background: 'var(--bg-app)' }}>
      <div className="theory-pane">
        <h2>Control Engineering & Kinematics Reference</h2>

        <h3>1. Standard PID Controller Formulation</h3>
        <p>In continuous time, the parallel PID control law is defined as:</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>u(t) = Kp * e(t) + Ki * ∫ e(τ) dτ + Kd * (de(t)/dt)</code>
        </p>
        <ul>
          <li>
            <strong>Proportional (P)</strong>: Generates an action proportional to current error $e(t) = r(t) - y(t)$. Increases response speed but can leave steady-state error under friction or constant load disturbances.
          </li>
          <li>
            <strong>Integral (I)</strong>: Accumulates historical error. Eliminates steady-state error, but introduces phase lag and can induce overshoot or integrator windup.
          </li>
          <li>
            <strong>Derivative (D)</strong>: Predicts error rate of change. Adds damping. A low-pass filter ($N$) prevents high-frequency noise amplification.
          </li>
        </ul>

        <h3>2. Integrator Windup & Anti-Windup</h3>
        <p>
          Actuators have finite limits (±Umax). When saturated, an unconstrained integrator continues accumulating error, causing heavy overshoot while unwinding.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Clamping</strong>: Freezes integral accumulation whenever output saturates and error drives it further into saturation.
        </p>

        <h3>3. Derivative on Measurement (PI-D & I-PD)</h3>
        <p>
          Abrupt step changes in setpoint cause derivative impulse spikes. <strong>PI-D</strong> computes derivative action exclusively from measured PV (<code>-Kd * dy/dt</code>), avoiding derivative kick completely.
        </p>

        <h3>4. 2-Link Planar Inverse Kinematics (IK)</h3>
        <p>Analytical solution mapping end-effector target $(x, y)$ to joint angles $(\theta_1, \theta_2)$:</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>cos(θ2) = (x^2 + y^2 - L1^2 - L2^2) / (2 * L1 * L2)</code>
        </p>
      </div>
    </main>
  );
};
