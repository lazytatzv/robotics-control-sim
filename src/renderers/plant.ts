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
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
  }

  public renderMotor(data: StepDataPoint, isVelocityMode: boolean): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const radius = Math.min(w * 0.22, h * 0.38);

    // Coordinate grid lines (Standard Math: +X Right, +Y Up)
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 2.2, cy);
    ctx.lineTo(cx + radius * 2.2, cy);
    ctx.moveTo(cx, cy - radius * 1.2);
    ctx.lineTo(cx, cy + radius * 1.2);
    ctx.stroke();

    // Motor Stator Housing (Square CNC Flange)
    const housingW = radius * 1.6;
    const housingH = radius * 1.6;
    ctx.fillStyle = '#121216';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(cx - housingW, cy - housingH, housingW * 2, housingH * 2, 8 * dpr);
    ctx.fill();
    ctx.stroke();

    // Stator Bolts
    ctx.fillStyle = '#27272a';
    const boltOffset = housingW - 10 * dpr;
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sy) => {
        ctx.beginPath();
        ctx.arc(cx + sx * boltOffset, cy + sy * boltOffset, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Rotor Disc
    ctx.fillStyle = '#18181f';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Angle Ticks (Math convention: Counter-Clockwise positive)
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const isCard = i % 3 === 0;
      const tLen = (isCard ? 8 : 4) * dpr;
      // Note: -sin(ang) converts screen Y (down) to Cartesian Y (up)
      const x1 = cx + (radius - tLen) * Math.cos(ang);
      const y1 = cy - (radius - tLen) * Math.sin(ang);
      const x2 = cx + radius * Math.cos(ang);
      const y2 = cy - radius * Math.sin(ang);
      ctx.strokeStyle = isCard ? '#71717a' : '#3f3f46';
      ctx.lineWidth = (isCard ? 1.5 : 1) * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    if (!isVelocityMode) {
      // Target Setpoint Pointer (Standard Cartesian Y up: -sin)
      const targetAngle = data.setpoint;
      const tx = cx + (radius - 2 * dpr) * Math.cos(targetAngle);
      const ty = cy - (radius - 2 * dpr) * Math.sin(targetAngle);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target Crosshair / Dot
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Actual Rotor Needle (Standard Cartesian Y up: -sin)
    const currentAngle = isVelocityMode ? data.t * data.velocity : data.actual;
    const ax = cx + (radius - 4 * dpr) * Math.cos(currentAngle);
    const ay = cy - (radius - 4 * dpr) * Math.sin(currentAngle);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Center Hub Pivot
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 2 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Speed indicator arc
    if (Math.abs(data.velocity) > 0.05) {
      const velDir = data.velocity > 0 ? -1 : 1; // CCW vs CW in screen coords
      const arcR = radius * 0.5;
      const startArc = -currentAngle;
      const arcLen = Math.min(Math.abs(data.velocity) * 0.25, Math.PI * 0.75) * velDir;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, startArc, startArc + arcLen, velDir < 0);
      ctx.stroke();
    }

    // Precision HUD Overlays
    ctx.font = `${9.5 * dpr}px ui-monospace, SFMono-Regular, monospace`;

    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'left';
    ctx.fillText(`PLANT: DC-MOTOR (${isVelocityMode ? 'VELOCITY' : 'POSITION'})`, 16 * dpr, 20 * dpr);
    ctx.fillText(`CURRENT: ${data.current.toFixed(2)} A`, 16 * dpr, 36 * dpr);
    ctx.fillText(`VOLTAGE: ${data.u.toFixed(2)} V`, 16 * dpr, 52 * dpr);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SPEED: ${data.velocity.toFixed(2)} rad/s`, w - 16 * dpr, 20 * dpr);
    if (!isVelocityMode) {
      const errorDeg = Math.abs(data.error * 180 / Math.PI);
      const isSettled = errorDeg < 0.5 && Math.abs(data.velocity) < 0.02;
      ctx.fillStyle = isSettled ? '#22c55e' : '#ffffff';
      ctx.fillText(`POSITION: ${((data.actual * 180) / Math.PI).toFixed(1)}° (${data.actual.toFixed(3)} rad)`, w - 16 * dpr, 36 * dpr);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`TARGET: ${((data.setpoint * 180) / Math.PI).toFixed(1)}° [ERR: ${errorDeg.toFixed(2)}°]`, w - 16 * dpr, 52 * dpr);
    }
  }

  public renderCart(data: StepDataPoint): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const groundY = h * 0.65;
    const wallX = 35 * dpr;

    // Linear Guide Rail
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Solid Fixed Base Wall
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1 * dpr;
    ctx.fillRect(0, 25 * dpr, wallX, groundY - 25 * dpr);
    ctx.strokeRect(0, 25 * dpr, wallX, groundY - 25 * dpr);

    const scale = 70 * dpr;
    const centerScreenX = w * 0.52;
    const cartX = centerScreenX + data.actual * scale;
    const cartW = 64 * dpr;
    const cartH = 34 * dpr;
    const cartY = groundY - cartH - 3 * dpr;

    // Spring (Cyan coil)
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
      const dy = i === 0 || i === coils ? 0 : (i % 2 === 1 ? -7 * dpr : 7 * dpr);
      ctx.lineTo(sx, springY + dy);
    }
    ctx.stroke();

    // Damper
    const damperY = cartY + cartH * 0.72;
    const cylinderLen = 42 * dpr;
    const cylinderW = 10 * dpr;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1 * dpr;
    ctx.fillRect(wallX + 8 * dpr, damperY - cylinderW / 2, cylinderLen, cylinderW);
    ctx.strokeRect(wallX + 8 * dpr, damperY - cylinderW / 2, cylinderLen, cylinderW);
    ctx.beginPath();
    ctx.moveTo(wallX + 8 * dpr + cylinderLen * 0.6, damperY);
    ctx.lineTo(cartX, damperY);
    ctx.stroke();

    // Target Setpoint Ghost Box (Amber dashed)
    const targetCartX = centerScreenX + data.setpoint * scale;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.setLineDash([3 * dpr, 3 * dpr]);
    ctx.strokeRect(targetCartX, cartY, cartW, cartH);
    ctx.setLineDash([]);

    // Cart Body
    ctx.fillStyle = '#121215';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(cartX, cartY, cartW, cartH, 4 * dpr);
    ctx.fill();
    ctx.stroke();

    // Cart Bearing pads
    ctx.fillStyle = '#52525b';
    ctx.fillRect(cartX + 8 * dpr, groundY - 3 * dpr, 10 * dpr, 3 * dpr);
    ctx.fillRect(cartX + cartW - 18 * dpr, groundY - 3 * dpr, 10 * dpr, 3 * dpr);

    // Control Force Vector Arrow
    if (Math.abs(data.u) > 0.1) {
      const arrowLen = Math.max(Math.min(data.u * 3 * dpr, 50 * dpr), -50 * dpr);
      const startX = cartX + cartW / 2;
      const startY = cartY + cartH / 2;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + arrowLen, startY);
      ctx.stroke();
    }

    // HUD Telemetry
    ctx.font = `${9.5 * dpr}px ui-monospace, SFMono-Regular, monospace`;
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'left';
    ctx.fillText('PLANT: MASS-SPRING-DAMPER (CART)', 16 * dpr, 20 * dpr);
    ctx.fillText(`POSITION: ${data.actual.toFixed(3)} m`, 16 * dpr, 36 * dpr);
    ctx.fillText(`TARGET: ${data.setpoint.toFixed(2)} m`, 16 * dpr, 52 * dpr);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`VELOCITY: ${data.velocity.toFixed(3)} m/s`, w - 16 * dpr, 20 * dpr);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`FORCE u: ${data.u.toFixed(2)} N`, w - 16 * dpr, 36 * dpr);
  }
}
