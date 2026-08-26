# Industrial Robotics & Control Engineering Lab

[![Rust](https://img.shields.io/badge/Rust-WASM-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, industrial-grade browser-based simulator and CAD/CAE suite for modern control systems, servo robotics, and kinematics analysis. Powered by **Rust (WebAssembly)**, **React 19**, and **HTML5 Canvas** with buttery-smooth 60 FPS oscilloscope telemetry.

🎮 **Live Interactive Simulation:** [https://lazytatzv.github.io/robotics-control-sim/](https://lazytatzv.github.io/robotics-control-sim/)

---

## 🌟 Key Features & Architectures

### 1. 🎛️ Advanced Control Architectures
* **PID & 2-DOF PID (Setpoint Weighting)**: Independent optimization of setpoint tracking ($b, c$) and disturbance rejection.
* **Feedforward Control**: Velocity FF ($K_{vff}$), Acceleration FF ($K_{aff}$), and Coulomb friction compensation ($K_{fric}$).
* **Cascade P-PI Dual-Loop Servo**: Industry standard (FANUC/Yaskawa style) with outer Position P-loop and inner Velocity PI-loop with physical velocity limits.
* **Sliding Mode Control (SMC)**: Ultra-robust nonlinear control on sliding manifold $s(t) = \dot{e} + \lambda e = 0$ with continuous boundary layer ($\epsilon$) for chattering-free operation.
* **Anti-Windup**: Conditional integration (Clamping) and Tracking Back-Calculation ($K_b$).

### 2. 📉 Signal Processing & Trajectory Planning
* **Bi-quad Mechanical Notch Filter**: Deep attenuation of resonant frequencies ($\omega_n, \zeta_n, \zeta_d$) in flexible couplings and gearboxes.
* **S-Curve / Jerk-Limited Trajectory**: Continuous 3rd-order trajectory generation ($v_{max}, a_{max}, j_{max}$) avoiding shock and mechanical excitation.

### 3. 📊 Frequency Domain & Stability Analysis
* **Real-time Bode Plot ($0.05 \sim 2000\ \text{rad/s}$)**: Logarithmic open-loop $L(j\omega)$ and closed-loop $T(j\omega)$ frequency response.
* **Automated Stability Telemetry**: Gain Crossover Frequency ($\omega_{gc}$), Phase Margin ($\Phi_m$), Phase Crossover Frequency ($\omega_{pc}$), Gain Margin ($G_m$), and Closed-loop $-3\text{dB}$ Bandwidth.

### 4. ⚡ 1-Click Auto-Tuning Engine
* **Pole Placement (Critically Damped $\zeta=1.0$)**: $0.0\%$ overshoot with minimum settling time.
* **Pole Placement (Fast Butterworth $\zeta=0.707$)**: Maximum flat passband with snappy response ($\approx 4.3\%$ overshoot).
* **Chien-Hrones-Reswick (CHR 0% / 20% Overshoot)** & **Ziegler-Nichols Classical**.

### 5. ⚙️ Real-World Industrial Physical Plants
* **DC Motor**: Parameterized by $J$ (rotor inertia), $B$ (viscous damping), $K_t$ (torque constant), $K_e$ (back-EMF), $R$ (armature resistance), $L$ (inductance), $\tau_c$ (Coulomb friction), and $N_{gear}$ (gearbox ratio).
* **Presets**: Industrial Servo (FANUC/Yaskawa), FPV Racing Drone BLDC, Precision CNC Ball-Screw, SG90 Micro Hobby Servo, Heavy 10kg Robot Arm Joint.
* **Mass-Spring-Damper**: Linear Cartesian motion stage with spring stiffness and friction.

### 6. 🔬 Professional Telemetry & A/B Testing
* **📸 Snapshot Ghost Trace (A/B Testing)**: Freeze baseline waveforms as dashed overlays to directly compare tuning parameters.
* **💾 CSV Telemetry Export**: Download time series data ($t, r, y, v, u, P, I, D, FF, i, \text{sat}$) for MATLAB / Python pandas.
* **⚡ 5S High-Precision Batch Mode**: Instant 5.0s step response calculated in Rust @ $\Delta t = 5\text{ms}$.

### 7. 🦾 Planar Robot Arm Kinematics
* 2-DOF planar robot arm with interactive target dragging.
* Real-time analytical Forward & Inverse Kinematics (FK / IK) with Elbow-Up / Elbow-Down configuration switcher and workspace limit guards.

---

## 🛠️ Tech Stack & Architecture

* **Simulation Physics Engine**: Rust (`crates/control-core`, `no_std` compatible, RK4 continuous integration).
* **WASM Boundary**: `wasm-bindgen` + `serde-wasm-bindgen` for zero-overhead data transfer.
* **Frontend**: React 19, TypeScript 5, Vite 5, Lucide Icons, HTML5 Canvas 2D.
* **Zero-Lag UI**: Memoized controls, $O(1)$ amortized sliding buffer, 12Hz throttled metrics with 60 FPS silky smooth Canvas rendering.

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+)
* [pnpm](https://pnpm.io/)
* [Rust & wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (for WASM rebuilds)

### Installation & Run

```bash
# 1. Install dependencies
pnpm install

# 2. Build WebAssembly module (if modified)
cd crates/wasm-bridge && wasm-pack build --target web --out-dir ../../pkg && cd ../..

# 3. Start development server
pnpm dev

# 4. Build production bundle
pnpm build
```

---

## 📖 Theoretical Reference & Documentation

Detailed mathematical formulations, Bode stability criteria, cascade servo loops, and sliding mode Lyapunov proofs are available directly inside the app's **`THEORY GUIDE`** tab.

---

## 📄 License

MIT License. Copyright (c) 2026.
