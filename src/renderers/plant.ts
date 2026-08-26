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
    const cy = h / 2 + 5 * dpr;
    const radius = Math.min(w, h) * 0.34;

    // Stator Outer Ring
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 12 * dpr, 0, Math.PI * 2);
    ctx.stroke();

    // Motor Stator Disc
    ctx.fillStyle = '#121215';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle dial marks
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const tickLen = (isMajor ? 8 : 4) * dpr;
      const x1 = cx + (radius - tickLen) * Math.cos(angle);
      const y1 = cy + (radius - tickLen) * Math.sin(angle);
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);
      ctx.strokeStyle = isMajor ? '#71717a' : '#27272a';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    if (!isVelocityMode) {
      // Setpoint Vector (Amber dashed)
      const targetAngle = data.setpoint;
      const tx = cx + (radius - 6 * dpr) * Math.cos(targetAngle);
      const ty = cy + (radius - 6 * dpr) * Math.sin(targetAngle);

      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([3 * dpr, 2 * dpr]);
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Actual Rotor Vector (Cyan)
    const currentAngle = isVelocityMode ? (data.t * data.velocity) : data.actual;
    const ax = cx + (radius - 8 * dpr) * Math.cos(currentAngle);
    const ay = cy + (radius - 8 * dpr) * Math.sin(currentAngle);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Center Core
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // HUD Telemetry overlay
    ctx.fillStyle = '#71717a';
    ctx.font = `${9 * dpr}px ui-monospace, SFMono-Regular, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`SYSTEM: DC MOTOR (${isVelocityMode ? 'VELOCITY' : 'POSITION'})`, 12 * dpr, 16 * dpr);
    ctx.fillText(`CURRENT: ${data.current.toFixed(2)} A`, 12 * dpr, 30 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`SPEED: ${data.velocity.toFixed(2)} rad/s`, w - 12 * dpr, 16 * dpr);
    if (!isVelocityMode) {
      ctx.fillText(`ANGLE: ${((data.actual * 180) / Math.PI).toFixed(1)}°`, w - 12 * dpr, 30 * dpr);
    }
  }

  public renderCart(data: StepDataPoint): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const groundY = h * 0.72;
    const wallX = 35 * dpr;

    // Ground line
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Wall
    ctx.fillStyle = '#121215';
    ctx.fillRect(0, 30 * dpr, wallX, groundY - 30 * dpr);
    ctx.strokeStyle = '#3f3f46';
    ctx.beginPath();
    ctx.moveTo(wallX, 30 * dpr);
    ctx.lineTo(wallX, groundY);
    ctx.stroke();

    const scale = 75 * dpr;
    const centerScreenX = w / 2;
    const cartX = centerScreenX + data.actual * scale;
    const cartW = 60 * dpr;
    const cartH = 34 * dpr;
    const wheelR = 6 * dpr;
    const cartY = groundY - wheelR * 2 - cartH;

    // Spring
    const springStartX = wallX;
    const springEndX = cartX;
    const springY = cartY + cartH * 0.35;
    const coils = 12;
    const springLen = springEndX - springStartX;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(springStartX, springY);
    for (let i = 0; i <= coils; i++) {
      const sx = springStartX + (i / coils) * springLen;
      const dy = i === 0 || i === coils ? 0 : (i % 2 === 1 ? -8 * dpr : 8 * dpr);
      ctx.lineTo(sx, springY + dy);
    }
    ctx.stroke();

    // Damper
    const damperY = cartY + cartH * 0.75;
    const cylinderLen = 40 * dpr;
    const cylinderW = 10 * dpr;
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1.5 * dpr;
    ctx.strokeRect(wallX + 10 * dpr, damperY - cylinderW / 2, cylinderLen, cylinderW);
    ctx.beginPath();
    ctx.moveTo(wallX + 10 * dpr + cylinderLen * 0.5, damperY);
    ctx.lineTo(cartX, damperY);
    ctx.stroke();

    // Target ghost
    const targetCartX = centerScreenX + data.setpoint * scale;
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([3 * dpr, 2 * dpr]);
    ctx.strokeRect(targetCartX, cartY, cartW, cartH);
    ctx.setLineDash([]);

    // Cart Body
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * dpr;
    ctx.fillRect(cartX, cartY, cartW, cartH);
    ctx.strokeRect(cartX, cartY, cartW, cartH);

    // Wheels
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1 * dpr;

    const w1x = cartX + cartW * 0.25;
    const w2x = cartX + cartW * 0.75;
    const wheelY = groundY - wheelR;

    ctx.beginPath();
    ctx.arc(w1x, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w2x, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // HUD Telemetry
    ctx.fillStyle = '#71717a';
    ctx.font = `${9 * dpr}px ui-monospace, SFMono-Regular, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('SYSTEM: MASS-SPRING-DAMPER', 12 * dpr, 16 * dpr);
    ctx.fillText(`POS (x): ${data.actual.toFixed(3)} m (TARGET: ${data.setpoint.toFixed(2)} m)`, 12 * dpr, 30 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`VEL (v): ${data.velocity.toFixed(3)} m/s`, w - 12 * dpr, 16 * dpr);
    ctx.fillText(`FORCE (u): ${data.u.toFixed(2)} N`, w - 12 * dpr, 30 * dpr);
  }
}
