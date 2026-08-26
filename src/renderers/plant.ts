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
    const cy = h / 2 + 10 * dpr;
    const radius = Math.min(w, h) * 0.32;

    // Background decorative ring
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 12 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 15 * dpr, 0, Math.PI * 2);
    ctx.stroke();

    // Motor Stator (outer housing)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Angle ticks
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x1 = cx + (radius - 12 * dpr) * Math.cos(angle);
      const y1 = cy + (radius - 12 * dpr) * Math.sin(angle);
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);
      ctx.strokeStyle = i % 3 === 0 ? '#94a3b8' : '#475569';
      ctx.lineWidth = (i % 3 === 0 ? 3 : 1.5) * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    if (!isVelocityMode) {
      // Target Setpoint Indicator (Ghost Needle / Orange line)
      const targetAngle = data.setpoint;
      const tx = cx + (radius - 10 * dpr) * Math.cos(targetAngle);
      const ty = cy + (radius - 10 * dpr) * Math.sin(targetAngle);

      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.setLineDash([5 * dpr, 3 * dpr]);
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target target dot
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(tx, ty, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rotor Actual Needle (Cyan / Blue)
    const currentAngle = isVelocityMode ? (data.t * data.velocity) : data.actual;
    const ax = cx + (radius - 15 * dpr) * Math.cos(currentAngle);
    const ay = cy + (radius - 15 * dpr) * Math.sin(currentAngle);

    ctx.strokeStyle = '#38bdf8'; // sky-400
    ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Center Hub
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Center pin
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Velocity circular arrow
    if (Math.abs(data.velocity) > 0.05) {
      const velDir = data.velocity > 0 ? 1 : -1;
      const arcRadius = radius * 0.55;
      const startArc = currentAngle;
      const arcLen = Math.min(Math.abs(data.velocity) * 0.3, Math.PI * 0.8) * velDir;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, arcRadius, startArc, startArc + arcLen, velDir < 0);
      ctx.stroke();
    }

    // Top status badges
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`Mode: ${isVelocityMode ? 'Velocity [rad/s]' : 'Position [rad]'}`, 12 * dpr, 18 * dpr);
    ctx.fillText(`Current: ${data.current.toFixed(2)} A`, 12 * dpr, 34 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`Speed: ${data.velocity.toFixed(2)} rad/s`, w - 12 * dpr, 18 * dpr);
    if (!isVelocityMode) {
      ctx.fillText(`Angle: ${((data.actual * 180) / Math.PI).toFixed(1)}°`, w - 12 * dpr, 34 * dpr);
    }
  }

  public renderCart(data: StepDataPoint): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const groundY = h * 0.72;
    const wallX = 40 * dpr;

    // Draw Ground
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Ground hatch lines
    for (let x = 0; x < w; x += 15 * dpr) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 8 * dpr, groundY + 10 * dpr);
      ctx.stroke();
    }

    // Draw Wall
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 30 * dpr, wallX, groundY - 30 * dpr);
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(wallX, 30 * dpr);
    ctx.lineTo(wallX, groundY);
    ctx.stroke();

    // Cart position mapping (center at x=0 -> screen center)
    const scale = 80 * dpr; // 80 pixels per meter
    const centerScreenX = w / 2;
    const cartX = centerScreenX + data.actual * scale;
    const cartW = 70 * dpr;
    const cartH = 40 * dpr;
    const wheelR = 8 * dpr;
    const cartY = groundY - wheelR * 2 - cartH;

    // Draw Spring from Wall to Cart
    const springStartX = wallX;
    const springEndX = cartX;
    const springY = cartY + cartH * 0.35;
    const coils = 10;
    const springLen = springEndX - springStartX;

    ctx.strokeStyle = '#38bdf8'; // sky-400
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(springStartX, springY);
    for (let i = 0; i <= coils; i++) {
      const sx = springStartX + (i / coils) * springLen;
      const dy = i === 0 || i === coils ? 0 : (i % 2 === 1 ? -12 * dpr : 12 * dpr);
      ctx.lineTo(sx, springY + dy);
    }
    ctx.stroke();

    // Draw Damper below spring
    const damperY = cartY + cartH * 0.75;
    const cylinderLen = 45 * dpr;
    const cylinderW = 14 * dpr;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(wallX + 15 * dpr, damperY - cylinderW / 2, cylinderLen, cylinderW);
    // Damper Piston Rod into Cart
    ctx.beginPath();
    ctx.moveTo(wallX + 15 * dpr + cylinderLen * 0.6, damperY);
    ctx.lineTo(cartX, damperY);
    ctx.stroke();

    // Target position ghost marker
    const targetCartX = centerScreenX + data.setpoint * scale;
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.strokeRect(targetCartX, cartY, cartW, cartH);
    ctx.setLineDash([]);

    // Draw Cart Body
    ctx.fillStyle = '#0284c7'; // sky-600
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.fillRect(cartX, cartY, cartW, cartH);
    ctx.strokeRect(cartX, cartY, cartW, cartH);

    // Cart Wheels
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2 * dpr;

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

    // Force vector arrow on cart
    if (Math.abs(data.u) > 0.1) {
      const forceArrowLen = Math.max(Math.min(data.u * 3 * dpr, 60 * dpr), -60 * dpr);
      const arrowStartX = cartX + cartW / 2;
      const arrowY = cartY + cartH / 2;
      ctx.strokeStyle = '#ec4899'; // pink-500
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowY);
      ctx.lineTo(arrowStartX + forceArrowLen, arrowY);
      ctx.stroke();
    }

    // Top status badges
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Model: Mass-Spring-Damper (Cart)', 12 * dpr, 18 * dpr);
    ctx.fillText(`Pos x: ${data.actual.toFixed(3)} m (Target: ${data.setpoint.toFixed(2)} m)`, 12 * dpr, 34 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`Vel v: ${data.velocity.toFixed(3)} m/s`, w - 12 * dpr, 18 * dpr);
    ctx.fillText(`Force u: ${data.u.toFixed(2)} N`, w - 12 * dpr, 34 * dpr);
  }
}
