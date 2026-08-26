import React, { useState } from 'react';

type SectionKey =
  | 'guide'
  | 'pid_2dof'
  | 'cascade'
  | 'smc'
  | 'notch_scurve'
  | 'bode_stability'
  | 'nyquist'
  | 'signals_ident'
  | 'autotune'
  | 'kinematics';

export const TheoryGuide: React.FC = () => {
  const [activeKey, setActiveKey] = useState<SectionKey>('guide');

  const navItems: { key: SectionKey; title: string; subtitle: string }[] = [
    { key: 'guide', title: '01 // QUICK START & USAGE', subtitle: 'Oscilloscope, Bode, Nyquist & batch modes' },
    { key: 'pid_2dof', title: '02 // PID, 2-DOF & FEEDFORWARD', subtitle: 'Filtered derivative, setpoint weights, FF' },
    { key: 'cascade', title: '03 // CASCADE P-PI SERVO', subtitle: 'Industrial dual-loop position-velocity control' },
    { key: 'smc', title: '04 // SLIDING MODE CONTROL (SMC)', subtitle: 'Robust nonlinear control with boundary layer' },
    { key: 'notch_scurve', title: '05 // NOTCH FILTER & S-CURVE', subtitle: 'Resonance suppression & jerk-limited motion' },
    { key: 'bode_stability', title: '06 // BODE & STABILITY MARGINS', subtitle: 'Phase/gain margins & bandwidth criteria' },
    { key: 'nyquist', title: '07 // NYQUIST STABILITY CRITERION', subtitle: 'Complex plane locus & (-1, 0j) encirclement' },
    { key: 'signals_ident', title: '08 // EXCITATION & IDENTIFICATION', subtitle: 'Impulse, Ramp tracking & Chirp Sine Sweep' },
    { key: 'autotune', title: '09 // AUTO-TUNING ALGORITHMS', subtitle: 'Pole placement, CHR & Ziegler-Nichols' },
    { key: 'kinematics', title: '10 // ROBOT ARM KINEMATICS', subtitle: '2-DOF planar analytical FK and IK' },
  ];

  return (
    <main style={{ gridTemplateColumns: '270px 1fr', background: 'var(--bg-black)', height: 'calc(100vh - 45px)' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ borderRight: '1px solid var(--border-subtle)', padding: '0.75rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-bright)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          ENGINEERING REFERENCE MANUAL
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              style={{
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
                background: activeKey === item.key ? '#27272a' : '#141417',
                border: activeKey === item.key ? '1px solid #3f3f46' : '1px solid #1f1f23',
                color: activeKey === item.key ? '#fafafa' : '#a1a1aa',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em' }}>{item.title}</div>
              <div style={{ fontSize: '0.62rem', color: '#71717a', marginTop: '0.2rem' }}>{item.subtitle}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <section style={{ overflowY: 'auto', padding: '2rem 3rem', maxWidth: '1050px', lineHeight: 1.7, color: 'var(--text-main)' }}>
        {/* SECTION 1: QUICK START & USAGE */}
        {activeKey === 'guide' && (
          <div className="reference-view">
            <h2>01 // SIMULATOR QUICK START & USAGE GUIDE</h2>
            <p>
              This suite provides a real-time, industrial-grade simulation environment powered by continuous-time numerical
              integration (RK4 / Euler) in Rust WebAssembly, coupled with a 60 FPS HTML5 Canvas oscilloscope and telemetry deck.
            </p>

            <h3>1. Scope Analysis Modes</h3>
            <ul>
              <li>
                <strong>TIME SCOPE (Real-time Continuous Mode)</strong>:
                A continuous, moving-window oscilloscope displaying active plant position, velocity, control effort, and PID components.
              </li>
              <li>
                <strong>BODE PLOT (Frequency Response Analysis)</strong>:
                Real-time frequency-domain computation of open-loop L(jω) and closed-loop T(jω) transfer functions across 0.05 to 2000 rad/s.
              </li>
              <li>
                <strong>NYQUIST PLOT (Polar Complex Stability Mode)</strong>:
                Visualizes open-loop frequency locus on the complex plane (Re, Im) with critical point (-1, 0j) and unit circle overlays.
              </li>
              <li>
                <strong>5S BATCH (Instant Step Response Mode)</strong>:
                Similar to MATLAB <code>step(sys)</code>, calculates a full 0.0s to 5.0s step transient instantaneously in Rust at Δt = 5ms.
              </li>
            </ul>

            <h3>2. Dynamic Excitation Waveforms</h3>
            <ul>
              <li><strong>STEP INPUT</strong>: Standard step setpoint transition with automated rise time (tr), peak overshoot (Mp), and settling time (ts).</li>
              <li><strong>IMPULSE TRAIN</strong>: Dirac delta pulse excitation testing instantaneous recovery and energy dissipation.</li>
              <li><strong>RAMP INPUT</strong>: Constant-velocity tracking assessing steady-state velocity error (ess).</li>
              <li><strong>CHIRP SINE SWEEP</strong>: Continuous frequency sweep excitation (0.1 Hz to 30 Hz) for physical resonance and friction identification.</li>
            </ul>
          </div>
        )}

        {/* SECTION 2: PID, 2-DOF & FEEDFORWARD */}
        {activeKey === 'pid_2dof' && (
          <div className="reference-view">
            <h2>02 // CONTINUOUS PID, 2-DOF & FEEDFORWARD CONTROL</h2>
            
            <h3>1. Filtered Derivative PID Formulation</h3>
            <p>
              To prevent amplification of high-frequency sensor noise, the derivative term includes a 1st-order low-pass filter coefficient N:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              u(t) = Kp · e(t) + Ki · ∫ e(τ) dτ + Kd · (de_f(t)/dt)<br />
              where  de_f/dt + N · e_f = N · de/dt  (Filter Cutoff: ω_c ≈ N rad/s)
            </div>

            <h3>2. Two-Degree-of-Freedom (2-DOF) PID</h3>
            <p>
              Standard 1-DOF PID couples setpoint tracking (servo performance) and disturbance rejection (regulation performance).
              2-DOF PID introduces setpoint weighting factors b (proportional) and c (derivative) to decouple both objectives:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              e_p(t) = b · r(t) - y(t) &nbsp;&nbsp;&nbsp;&nbsp;(b &lt; 1 reduces setpoint overshoot without sluggish disturbance recovery)<br />
              e_d(t) = c · r(t) - y(t) &nbsp;&nbsp;&nbsp;&nbsp;(c = 0 eliminates derivative kick on setpoint steps: PI-D form)
            </div>

            <h3>3. Feedforward Compensation (FF)</h3>
            <p>
              Feedforward injects model-based control effort anticipating trajectory dynamics before feedback errors develop:
            </p>
            <ul>
              <li><strong>Velocity FF (Kvff · dr/dt)</strong>: Pre-compensates back-EMF (Ke·ω) and viscous damping (B·ω).</li>
              <li><strong>Acceleration FF (Kaff · d²r/dt²)</strong>: Pre-compensates rotor inertial torque (J·α).</li>
              <li><strong>Friction FF (Kfric · sign(dr/dt))</strong>: Overcomes static Coulomb friction deadbands instantaneously upon velocity reversal.</li>
            </ul>

            <h3>4. Why Lowering Kp Can Increase Overshoot</h3>
            <p>
              When integral gain Ki remains active while Kp is reduced, the slower rise time causes error to accumulate over a longer duration (integrator windup).
              By the time the output reaches the setpoint, the integral term is excessively charged, causing large overshoot.
              Mathematically, the closed-loop damping ratio <code>ζ = (Beff + Km·Kp) / (2·sqrt(Km·Ki))</code> has Kp in the numerator; decreasing Kp directly reduces damping ratio ζ into an underdamped regime.
            </p>
          </div>
        )}

        {/* SECTION 3: CASCADE P-PI */}
        {activeKey === 'cascade' && (
          <div className="reference-view">
            <h2>03 // CASCADE P-PI DUAL-LOOP SERVO CONTROL</h2>
            <p>
              Industrial robotic servos and CNC drives (FANUC, Yaskawa, Mitsubishi, Beckhoff) standardly utilize a <strong>Cascade P-PI dual-loop architecture</strong> rather than a single PID loop.
            </p>

            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              [Outer Position Loop (P)]: v_target = clamp( Kpp · (r_pos - y_pos), -Vmax, +Vmax )<br />
              [Inner Velocity Loop (PI)]: u = clamp( Kvp · (v_target - v_act) + Kvi · ∫(v_target - v_act)dt, -Umax, +Umax )
            </div>

            <h3>Advantages of Cascade Servo Control</h3>
            <ul>
              <li>
                <strong>Strict Physical Velocity & Current Limiting</strong>:
                Clamping the output of the position loop (v_target) strictly guarantees maximum velocity limits regardless of large setpoint step commands.
              </li>
              <li>
                <strong>High-Bandwidth Disturbance Rejection</strong>:
                The inner velocity loop operates at a significantly higher bandwidth (hundreds of Hz), rejecting friction, back-EMF, and load torque variations before they alter position error.
              </li>
              <li>
                <strong>Decoupled Tuning Sequence</strong>:
                Enables independent tuning: first stiffen the inner velocity PI loop for optimal damping, then increase outer position gain Kpp for desired tracking bandwidth.
              </li>
            </ul>
          </div>
        )}

        {/* SECTION 4: SLIDING MODE CONTROL */}
        {activeKey === 'smc' && (
          <div className="reference-view">
            <h2>04 // SLIDING MODE CONTROL (ROBUST SMC)</h2>
            <p>
              Sliding Mode Control (SMC) is a variable-structure nonlinear control technique offering <strong>invariance</strong> to matched model parameter uncertainties and bounded external disturbances.
            </p>

            <h3>1. Sliding Manifold Design</h3>
            <p>
              A sliding surface s(t) = 0 is selected to define desired 1st-order error dynamics:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              s(t) = e_dot(t) + λ · e(t) = 0 &nbsp;&nbsp;&nbsp;&nbsp;(λ: sliding surface slope / time constant τ = 1/λ)
            </div>

            <h3>2. Control Law & Boundary Layer Chattering Alleviation</h3>
            <p>
              The control law combines equivalent control u_eq with a robust discontinuous switching term:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              u(t) = u_eq + K_switch · sat( s(t) / ε )<br />
              where  sat(x) = x (|x| ≤ 1),  sign(x) (|x| &gt; 1)
            </div>
            <ul>
              <li><strong>Lyapunov Reachability</strong>: Ensures s · s_dot &lt; -η |s| so state trajectories reach and remain on the manifold s = 0.</li>
              <li><strong>Continuous Boundary Layer (ε)</strong>: Replaces discontinuous sign(s) with a linear boundary layer of thickness ε, completely eliminating high-frequency actuator chattering.</li>
            </ul>
          </div>
        )}

        {/* SECTION 5: NOTCH FILTER & S-CURVE */}
        {activeKey === 'notch_scurve' && (
          <div className="reference-view">
            <h2>05 // MECHANICAL NOTCH FILTER & S-CURVE TRAJECTORY</h2>

            <h3>1. Bi-quad Mechanical Notch Filter</h3>
            <p>
              Mechanical drivetrains (harmonic drives, timing belts, ball screws) exhibit structural resonance frequencies.
              When servo bandwidth approaches these modes, self-excited oscillations occur. A bi-quad notch filter attenuates the exact resonance peak:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              H_n(s) = ( s² + 2·ζ_num·ω_n·s + ω_n² ) / ( s² + 2·ζ_den·ω_n·s + ω_n² )<br />
              (ω_n: center notch frequency [rad/s], ζ_num: notch depth, ζ_den: notch bandwidth)
            </div>

            <h3>2. S-Curve / Jerk-Limited Trajectory Generation</h3>
            <p>
              Abrupt step setpoints command infinite acceleration and infinite jerk (j = d³r/dt³), causing mechanical vibration, stress, and gear wear.
              An S-curve generator bounds velocity (v_max), acceleration (a_max), and jerk (j_max):
            </p>
            <ul>
              <li><strong>Trapezoidal Velocity Profile</strong>: Constant acceleration phases result in step changes in acceleration (infinite jerk spikes).</li>
              <li><strong>S-Curve Profile (Jerk-Limited)</strong>: Continuous acceleration transitions ensure smooth, resonance-free motion profiles suitable for precision robotics.</li>
            </ul>
          </div>
        )}

        {/* SECTION 6: BODE & STABILITY */}
        {activeKey === 'bode_stability' && (
          <div className="reference-view">
            <h2>06 // FREQUENCY RESPONSE & STABILITY MARGINS</h2>
            <p>
              Evaluating open-loop frequency response L(jω) = C(jω) P(jω) provides quantitative insight into stability margins and closed-loop bandwidth.
            </p>

            <h3>1. Frequency Response Metrics</h3>
            <ul>
              <li><strong>Gain Crossover Frequency (ω_gc)</strong>: Frequency where open-loop magnitude crosses 0 dB (|L(jω)| = 1).</li>
              <li><strong>Phase Margin (PM: Φ_m)</strong>: Phase lead above -180° at ω_gc: <code>Φ_m = 180° + ∠L(jω_gc)</code>.
                <br /><span style={{ color: '#22c55e' }}>Recommended: 45° to 60°</span> (values below 30° cause ringing and instability).
              </li>
              <li><strong>Phase Crossover Frequency (ω_pc)</strong>: Frequency where open-loop phase crosses -180°.</li>
              <li><strong>Gain Margin (GM: G_m)</strong>: Gain attenuation at ω_pc: <code>G_m = -20 log10 |L(jω_pc)| dB</code>.
                <br /><span style={{ color: '#22c55e' }}>Recommended: &gt; 6 dB to 12 dB</span>.
              </li>
              <li><strong>Closed-Loop Bandwidth (ω_BW)</strong>: Frequency where closed-loop T(jω) drops by -3 dB. Directly defines tracking speed limit.</li>
            </ul>
          </div>
        )}

        {/* SECTION 7: NYQUIST STABILITY */}
        {activeKey === 'nyquist' && (
          <div className="reference-view">
            <h2>07 // NYQUIST STABILITY CRITERION</h2>
            <p>
              The Nyquist stability criterion determines the absolute stability of a closed-loop system by mapping the open-loop
              frequency locus L(jω) across -∞ &lt; ω &lt; +∞ onto the complex plane (Re, Im).
            </p>

            <h3>1. Cauchy Argument Principle & Encirclement Law</h3>
            <p>
              The number of unstable closed-loop poles Z in the right-half plane (RHP) is governed by:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              Z = N + P<br />
              where  N = number of clockwise encirclements of critical point (-1, 0j)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; P = number of open-loop poles in RHP (P = 0 for open-loop stable plants)
            </div>
            <ul>
              <li><strong>Closed-Loop Stability Requirement</strong>: For open-loop stable plants (P = 0), the closed-loop system is strictly stable if and only if the locus <strong>does NOT encircle (-1, 0j)</strong> (i.e. N = 0).</li>
              <li><strong>Geometric Margins on Complex Plane</strong>:
                <ul>
                  <li><strong>Phase Margin (PM)</strong>: Angle between the negative real axis and the intersection of the locus with the unit circle |L| = 1.</li>
                  <li><strong>Gain Margin (GM)</strong>: Distance 1 / |L(jω_pc)| where the locus crosses the negative real axis.</li>
                </ul>
              </li>
            </ul>
          </div>
        )}

        {/* SECTION 8: EXCITATION & SYSTEM IDENTIFICATION */}
        {activeKey === 'signals_ident' && (
          <div className="reference-view">
            <h2>08 // DYNAMIC EXCITATION & SYSTEM IDENTIFICATION</h2>

            <h3>1. Dirac Delta Impulse Response</h3>
            <p>
              An ideal impulse contains infinite frequency components simultaneously. In physical simulation, a narrow pulse excitation
              tests the system impulse response h(t), exposing natural oscillation modes, damping, and energy dissipation rates.
            </p>

            <h3>2. Ramp Input & Steady-State Velocity Error (Type 1 Tracking)</h3>
            <p>
              Commanding a constant velocity reference r(t) = v0 · t tests the system type and velocity error constant Kv:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              e_v(t) = lim (t-&gt;inf) [ r(t) - y(t) ] = v0 / Kv<br />
              (Adding Velocity Feedforward Kvff reduces this lag to exactly 0.0)
            </div>

            <h3>3. Chirp Sine Sweep (Frequency Sweep Identification)</h3>
            <p>
              The chirp signal sweeps sinusoidal excitation from f0 to f1 over duration T:
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              r(t) = A · sin( 2π · ( f0·t + (f1 - f0)/(2·T) · t² ) )
            </div>
            <p>
              By observing the live phase lag and attenuation as excitation frequency increases, engineers can visually detect
              mechanical resonance peaks, verify notch filter attenuation in real time, and quantify non-linear friction deadbands.
            </p>
          </div>
        )}

        {/* SECTION 9: AUTO-TUNING */}
        {activeKey === 'autotune' && (
          <div className="reference-view">
            <h2>09 // MATHEMATICAL AUTO-TUNING ALGORITHMS</h2>
            <p>
              Synthesizes mathematically optimal controller gains based on identified physical motor parameters (J, B, Kt, Ke, R).
            </p>

            <h3>1. Pole Placement Method</h3>
            <p>Directly places closed-loop characteristic poles for target natural frequency ω_n and damping ratio ζ:</p>
            <ul>
              <li><strong>Critically Damped (ζ = 1.0)</strong>: Repeated real poles <code>(s + ω_n)²</code>. Guaranteed 0.0% overshoot with fastest monotonic convergence.</li>
              <li><strong>Fast Butterworth (ζ = 1/√2 ≈ 0.707)</strong>: Maximally flat passband response with snappy rise time and minimal ringing (≈ 4.3% overshoot).</li>
            </ul>

            <h3>2. Chien-Hrones-Reswick (CHR) Method</h3>
            <p>Industrial standard tuning optimized for setpoint tracking with controlled overshoot:</p>
            <ul>
              <li><strong>CHR 0% Overshoot</strong>: Conservative gains for strictly non-overshooting position tracking.</li>
              <li><strong>CHR 20% Overshoot</strong>: Aggressive gains maximizing response speed within a 20% overshoot bound.</li>
            </ul>
          </div>
        )}

        {/* SECTION 10: KINEMATICS */}
        {activeKey === 'kinematics' && (
          <div className="reference-view">
            <h2>10 // 2-DOF PLANAR ROBOT ARM KINEMATICS</h2>

            <h3>1. Forward Kinematics (FK)</h3>
            <p>Computes end-effector Cartesian coordinates (x, y) from joint angles (θ1, θ2):</p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              x = L1 · cos(θ1) + L2 · cos(θ1 + θ2)<br />
              y = L1 · sin(θ1) + L2 · sin(θ1 + θ2)
            </div>

            <h3>2. Analytical Inverse Kinematics (IK)</h3>
            <p>Solves required joint angles (θ1, θ2) for a given target position (x, y):</p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              cos(θ2) = ( x² + y² - L1² - L2² ) / ( 2 · L1 · L2 )<br />
              θ2 = ± arccos( cos(θ2) ) &nbsp;&nbsp;&nbsp;&nbsp;(elbow-up / elbow-down configurations)<br />
              θ1 = atan2(y, x) - atan2( L2·sin(θ2), L1 + L2·cos(θ2) )
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
