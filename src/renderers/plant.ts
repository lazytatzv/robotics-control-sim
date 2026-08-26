import { StepDataPoint } from '../sim-bridge';

export class PlantRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;
    this.handleResize();
  }

  public handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
  }

  public renderMotor(data: StepDataPoint, isVelocityMode: boolean): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 + 6 * dpr;
    const armLen = Math.min(w, h) * 0.35;

    // Technical Axis Grid
    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx - armLen * 1.3, cy);
    ctx.lineTo(cx + armLen * 1.3, cy);
    ctx.moveTo(cx, cy - armLen * 1.3);
    ctx.lineTo(cx, cy + armLen * 1.3);
    ctx.stroke();

    // Machine Housing (Square Flange)
    const boxSize = armLen * 0.95;
    ctx.fillStyle = '#0a0a0a';
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(cx - boxSize, cy - boxSize, boxSize * 2, boxSize * 2);

    // Rotary Bearing Outer Track
    ctx.strokeStyle = '#333333';
    ctx.beginPath();
    ctx.arc(cx, cy, armLen * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    if (!isVelocityMode) {
      // Target Setpoint Vector (Dashed Silver/White)
      const targetAngle = data.setpoint;
      const tx = cx + armLen * Math.cos(targetAngle);
      const ty = cy + armLen * Math.sin(targetAngle);

      ctx.strokeStyle = '#737373';
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target Crosshair point
      ctx.strokeStyle = '#a3a3a3';
      ctx.strokeRect(tx - 3 * dpr, ty - 3 * dpr, 6 * dpr, 6 * dpr);
    }

    // Actual Rotor Arm (Solid Crisp Pure White Line)
    const currentAngle = isVelocityMode ? (data.t * data.velocity) : data.actual;
    const ax = cx + armLen * Math.cos(currentAngle);
    const ay = cy + armLen * Math.sin(currentAngle);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // End-of-arm precision dot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ax - 2.5 * dpr, ay - 2.5 * dpr, 5 * dpr, 5 * dpr);

    // Center Hub Pivot
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Technical Readout Overlay
    ctx.fillStyle = '#525252';
    ctx.font = `${9 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`PLANT: DC-MOTOR [${isVelocityMode ? 'VELOCITY_MODE' : 'POSITION_MODE'}]`, 12 * dpr, 16 * dpr);
    ctx.fillText(`CURRENT: ${data.current.toFixed(2)} A`, 12 * dpr, 28 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`VELOCITY: ${data.velocity.toFixed(2)} RAD/S`, w - 12 * dpr, 16 * dpr);
    if (!isVelocityMode) {
      ctx.fillText(`POSITION: ${data.actual.toFixed(3)} RAD (${((data.actual * 180) / Math.PI).toFixed(1)}°)`, w - 12 * dpr, 28 * dpr);
    }
  }

  public renderCart(data: StepDataPoint): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const groundY = h * 0.68;
    const wallX = 30 * dpr;

    // Linear Rail / Ground (Minimalist Double Line)
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.moveTo(0, groundY + 4 * dpr);
    ctx.lineTo(w, groundY + 4 * dpr);
    ctx.stroke();

    // Base Support Wall
    ctx.fillStyle = '#121212';
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(0, 24 * dpr, wallX, groundY - 24 * dpr);

    const scale = 75 * dpr;
    const centerScreenX = w / 2;
    const cartX = centerScreenX + data.actual * scale;
    const cartW = 54 * dpr;
    const cartH = 30 * dpr;
    const cartY = groundY - cartH - 4 * dpr;

    // Minimalist Spring (Geometric wire)
    const springStartX = wallX;
    const springEndX = cartX;
    const springY = cartY + cartH * 0.5;
    const coils = 10;
    const springLen = springEndX - springStartX;

    ctx.strokeStyle = '#737373';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(springStartX, springY);
    for (let i = 0; i <= coils; i++) {
      const sx = springStartX + (i / coils) * springLen;
      const dy = i === 0 || i === coils ? 0 : (i % 2 === 1 ? -6 * dpr : 6 * dpr);
      ctx.lineTo(sx, springY + dy);
    }
    ctx.stroke();

    // Target Setpoint Indicator (Dashed Box)
    const targetCartX = centerScreenX + data.setpoint * scale;
    ctx.strokeStyle = '#525252';
    ctx.setLineDash([2 * dpr, 2 * dpr]);
    ctx.strokeRect(targetCartX, cartY, cartW, cartH);
    ctx.setLineDash([]);

    // Cart Body (Crisp Monochrome Box)
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * dpr;
    ctx.fillRect(cartX, cartY, cartW, cartH);
    ctx.strokeRect(cartX, cartY, cartW, cartH);

    // Linear bearings / sliders under cart
    ctx.fillStyle = '#737373';
    ctx.fillRect(cartX + 8 * dpr, groundY - 3 * dpr, 8 * dpr, 3 * dpr);
    ctx.fillRect(cartX + cartW - 16 * dpr, groundY - 3 * dpr, 8 * dpr, 3 * dpr);

    // Telemetry HUD
    ctx.fillStyle = '#525252';
    ctx.font = `${9 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('PLANT: MASS-SPRING-DAMPER', 12 * dpr, 16 * dpr);
    ctx.fillText(`POSITION: ${data.actual.toFixed(3)} M (TARGET: ${data.setpoint.toFixed(2)} M)`, 12 * dpr, 28 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`VELOCITY: ${data.velocity.toFixed(3)} M/S`, w - 12 * dpr, 16 * dpr);
    ctx.fillText(`CONTROL_U: ${data.u.toFixed(2)} N`, w - 12 * dpr, 28 * dpr);
  }
}
