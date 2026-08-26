# Robotics & Control Lab

A high-performance, browser-based simulator for control systems and robotics kinematics, powered by **Rust (WebAssembly)**, **React**, and **pnpm**.

🎮 **Live Demo:** [https://lazytatzv.github.io/robotics-control-sim/](https://lazytatzv.github.io/robotics-control-sim/)

---

## Features

* **Control Theory (PID & Anti-Windup)**:
  * DC Motor (Position & Velocity) and Mass-Spring-Damper dynamic systems
  * RK4 (4th-order Runge-Kutta) continuous physics integration
  * Standard PID, PI-D, and I-PD forms
  * Anti-windup clamping and back-calculation tracking
  * Low-pass filtered derivative term ($N$)
  * Real-time metrics: Rise time ($t_r$), Overshoot ($M_p$), Settling time ($t_s$), Steady-state error ($e_{ss}$)
* **Robotics Kinematics**:
  * 2-DOF planar robot arm Forward & Inverse Kinematics (FK / IK)
  * Real-time interactive target dragging with singularity handling
* **Ultra Lightweight**:
  * Pure HTML5 Canvas 2D rendering at 60 FPS
  * ~70 KB total gzip bundle size with zero external charting overhead

---

## Tech Stack

* **Core Engine**: Rust (`crates/control-core`, `no_std` compatible) + `wasm-bindgen`
* **Frontend**: React 19, TypeScript, Vite, Lucide Icons, HTML5 Canvas, pnpm

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

---

## License

MIT
