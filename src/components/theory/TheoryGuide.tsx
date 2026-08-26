import React from 'react';

export const TheoryGuide: React.FC = () => {
  return (
    <main style={{ gridTemplateColumns: '1fr', background: 'var(--bg-black)' }}>
      <div className="reference-view">
        <h2>01 // CONTINUOUS-TIME PID FORMULATION</h2>
        <p>The standard parallel PID control law is defined as:</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>u(t) = Kp * e(t) + Ki * ∫ e(τ) dτ + Kd * (de(t)/dt)</code>
        </p>
        <ul>
          <li>
            <strong>PROPORTIONAL (P)</strong>: Generates an action proportional to current error $e(t) = r(t) - y(t)$. Increases response speed but leaves steady-state offset under constant disturbances.
          </li>
          <li>
            <strong>INTEGRAL (I)</strong>: Accumulates historical error. Eliminates steady-state error completely, but introduces phase lag and can induce integrator windup.
          </li>
          <li>
            <strong>DERIVATIVE (D)</strong>: Predicts error rate of change. Adds damping. A 1st-order low-pass filter coefficient ($N$) prevents high-frequency noise amplification.
          </li>
        </ul>

        <h3>02 // INTEGRATOR WINDUP & ANTI-WINDUP</h3>
        <p>
          Physical actuators have finite voltage/current limits (±Umax). When output saturates, an unconstrained integrator accumulates error, causing severe overshoot while unwinding.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>CLAMPING</strong>: Freezes integral accumulation whenever the output is saturated and the error sign drives it further into saturation.
        </p>

        <h3>03 // DERIVATIVE ON MEASUREMENT (PI-D & I-PD)</h3>
        <p>
          Step changes in setpoint cause derivative impulse spikes. <strong>PI-D</strong> computes derivative action exclusively from measured PV (<code>-Kd * dy/dt</code>), avoiding derivative kick completely.
        </p>

        <h3>04 // 2-LINK PLANAR INVERSE KINEMATICS (IK)</h3>
        <p>Analytical geometric solution mapping end-effector Cartesian target $(x, y)$ to joint angles $(\theta_1, \theta_2)$:</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>cos(θ2) = (x^2 + y^2 - L1^2 - L2^2) / (2 * L1 * L2)</code>
        </p>
      </div>
    </main>
  );
};
