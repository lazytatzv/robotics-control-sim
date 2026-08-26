//! Numerical integrators for continuous-time dynamics simulation.

/// 4th-order Runge-Kutta (RK4) integration step for dynamic systems.
/// 
/// `f`: System derivative function `dx/dt = f(t, x, u)`
/// `t`: Current time
/// `x`: Current state array/slice
/// `u`: Current control input / disturbance
/// `dt`: Time step size
pub fn rk4_step<const N: usize, F>(f: F, t: f64, x: &[f64; N], u: f64, dt: f64) -> [f64; N]
where
    F: Fn(f64, &[f64; N], f64) -> [f64; N],
{
    // k1 = f(t, x, u)
    let k1 = f(t, x, u);

    // k2 = f(t + dt/2, x + dt/2 * k1, u)
    let mut x_temp = [0.0; N];
    for i in 0..N {
        x_temp[i] = x[i] + 0.5 * dt * k1[i];
    }
    let k2 = f(t + 0.5 * dt, &x_temp, u);

    // k3 = f(t + dt/2, x + dt/2 * k2, u)
    for i in 0..N {
        x_temp[i] = x[i] + 0.5 * dt * k2[i];
    }
    let k3 = f(t + 0.5 * dt, &x_temp, u);

    // k4 = f(t + dt, x + dt * k3, u)
    for i in 0..N {
        x_temp[i] = x[i] + dt * k3[i];
    }
    let k4 = f(t + dt, &x_temp, u);

    // x_next = x + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
    let mut x_next = [0.0; N];
    for i in 0..N {
        x_next[i] = x[i] + (dt / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
    }
    x_next
}

/// Simple Euler method integration step
pub fn euler_step<const N: usize, F>(f: F, t: f64, x: &[f64; N], u: f64, dt: f64) -> [f64; N]
where
    F: Fn(f64, &[f64; N], f64) -> [f64; N],
{
    let dx = f(t, x, u);
    let mut x_next = [0.0; N];
    for i in 0..N {
        x_next[i] = x[i] + dt * dx[i];
    }
    x_next
}
