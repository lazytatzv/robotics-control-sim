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

    // Subtle dark radial background glow
    const cx = w * 0.5;
    const cy = h * 0.5;
    const radius = Math.min(w * 0.22, h * 0.40);

    const bgGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.2);
    bgGrad.addColorStop(0, '#16161d');
    bgGrad.addColorStop(0.6, '#0f0f14');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 1. CNC Anodized Mounting Plate (Chamfered Industrial Flange)
    const flangeSize = radius * 1.55;
    const flangeGrad = ctx.createLinearGradient(cx - flangeSize, cy - flangeSize, cx + flangeSize, cy + flangeSize);
    flangeGrad.addColorStop(0, '#272730');
    flangeGrad.addColorStop(0.5, '#181820');
    flangeGrad.addColorStop(1, '#121217');

    ctx.fillStyle = flangeGrad;
    ctx.strokeStyle = '#383842';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(cx - flangeSize, cy - flangeSize, flangeSize * 2, flangeSize * 2, 12 * dpr);
    ctx.fill();
    ctx.stroke();

    // CNC Bolt Holes with Metallic Countersink
    const boltDist = flangeSize - 12 * dpr;
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sy) => {
        const bx = cx + sx * boltDist;
        const by = cy + sy * boltDist;
        ctx.fillStyle = '#0d0d12';
        ctx.beginPath();
        ctx.arc(bx, by, 5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3f3f4e';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();

        ctx.fillStyle = '#525266';
        ctx.beginPath();
        ctx.arc(bx, by, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // 2. Stator Core with 8 Pole Slots
    const statorRadius = radius * 1.15;
    ctx.fillStyle = '#14141c';
    ctx.strokeStyle = '#2e2e3a';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, statorRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stator Copper Winding Poles
    const poles = 8;
    for (let p = 0; p < poles; p++) {
      const poleAng = (p / poles) * Math.PI * 2;
      const px = cx + (radius * 1.06) * Math.cos(poleAng);
      const py = cy + (radius * 1.06) * Math.sin(poleAng);
      ctx.fillStyle = '#78350f'; // Copper winding color
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.arc(px, py, 4.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Encoder Dial Ring (Glass Optical Scale)
    ctx.fillStyle = '#101015';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // High Precision Angle Ticks (every 15° with 90° Major Ticks)
    ctx.font = `${7.5 * dpr}px ui-monospace, SFMono-Regular, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg / 180) * Math.PI;
      const isMajor = deg % 90 === 0;
      const isSemiMajor = deg % 45 === 0;
      const tickLen = isMajor ? 9 * dpr : isSemiMajor ? 6 * dpr : 3.5 * dpr;

      // Mathematical polar: -sin converts to Cartesian Y up
      const x1 = cx + (radius - tickLen) * Math.cos(rad);
      const y1 = cy - (radius - tickLen) * Math.sin(rad);
      const x2 = cx + radius * Math.cos(rad);
      const y2 = cy - radius * Math.sin(rad);

      ctx.strokeStyle = isMajor ? '#38bdf8' : isSemiMajor ? '#94a3b8' : '#334155';
      ctx.lineWidth = (isMajor ? 1.5 : 1) * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (isMajor) {
        const textR = radius - 16 * dpr;
        const tx = cx + textR * Math.cos(rad);
        const ty = cy - textR * Math.sin(rad);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${deg}°`, tx, ty);
      }
    }

    // 4. Target Position Ghost Line & Diamond Pointer (Amber)
    if (!isVelocityMode) {
      const targetAngle = data.setpoint;
      const tx = cx + (radius - 2 * dpr) * Math.cos(targetAngle);
      const ty = cy - (radius - 2 * dpr) * Math.sin(targetAngle);

      // Target Ghost Ray
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.setLineDash([5 * dpr, 3 * dpr]);
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // Neon Amber Diamond Target Pointer
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1 * dpr;
      const dSize = 5 * dpr;
      ctx.beginPath();
      ctx.moveTo(tx, ty - dSize);
      ctx.lineTo(tx + dSize, ty);
      ctx.lineTo(tx, ty + dSize);
      ctx.lineTo(tx - dSize, ty);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Dynamic Actual Rotor Pointer (Neon Cyan Needle with High-Response Hub)
    const currentAngle = isVelocityMode ? data.t * data.velocity : data.actual;
    const ax = cx + (radius - 5 * dpr) * Math.cos(currentAngle);
    const ay = cy - (radius - 5 * dpr) * Math.sin(currentAngle);

    // Glow shadow for active rotor needle
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8 * dpr;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3 * dpr;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Inner Hub Assembly
    const hubGrad = ctx.createRadialGradient(cx, cy, 2 * dpr, cx, cy, 14 * dpr);
    hubGrad.addColorStop(0, '#e2e8f0');
    hubGrad.addColorStop(0.5, '#475569');
    hubGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = hubGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, 12 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, 3 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // 6. Real-time Velocity Motion Arc
    if (Math.abs(data.velocity) > 0.05) {
      const velDir = data.velocity > 0 ? -1 : 1;
      const arcR = radius * 0.55;
      const startArc = -currentAngle;
      const arcLen = Math.min(Math.abs(data.velocity) * 0.35, Math.PI * 0.8) * velDir;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, startArc, startArc + arcLen, velDir < 0);
      ctx.stroke();
    }

    // 7. Modern Glassmorphism Telemetry HUD Cards
    ctx.font = `${9 * dpr}px ui-monospace, SFMono-Regular, monospace`;

    // Left HUD Card (Plant & Electrical State)
    const cardW = 150 * dpr;
    const cardH = 58 * dpr;
    ctx.fillStyle = 'rgba(18, 18, 24, 0.85)';
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.6)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.roundRect(14 * dpr, 14 * dpr, cardW, cardH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`MOTOR: ${isVelocityMode ? 'VELOCITY SERVO' : 'POSITION SERVO'}`, 22 * dpr, 20 * dpr);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`VOLTAGE (u): ${data.u.toFixed(2)} V`, 22 * dpr, 34 * dpr);
    ctx.fillText(`CURRENT (i): ${data.current.toFixed(2)} A`, 22 * dpr, 48 * dpr);

    // Right HUD Card (Kinematic Tracking State)
    const rCardW = 185 * dpr;
    ctx.fillStyle = 'rgba(18, 18, 24, 0.85)';
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.6)';
    ctx.beginPath();
    ctx.roundRect(w - rCardW - 14 * dpr, 14 * dpr, rCardW, cardH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(`SPEED (ω): ${data.velocity.toFixed(2)} rad/s`, w - rCardW - 6 * dpr, 20 * dpr);

    if (!isVelocityMode) {
      const errorDeg = Math.abs((data.error * 180) / Math.PI);
      const isSettled = errorDeg < 0.5 && Math.abs(data.velocity) < 0.02;
      ctx.fillStyle = isSettled ? '#22c55e' : '#ffffff';
      ctx.fillText(`ACTUAL (θ): ${((data.actual * 180) / Math.PI).toFixed(1)}° (${data.actual.toFixed(3)}r)`, w - rCardW - 6 * dpr, 34 * dpr);

      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`TARGET (r): ${((data.setpoint * 180) / Math.PI).toFixed(1)}° [ERR ${errorDeg.toFixed(2)}°]`, w - rCardW - 6 * dpr, 48 * dpr);
    }
  }

  public renderCart(data: StepDataPoint): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#141419');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const groundY = h * 0.68;
    const wallX = 40 * dpr;

    // Linear Guide Rail (Hardened Chrome Finish)
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, groundY, w, 14 * dpr);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Solid Fixed Base Wall
    const wallGrad = ctx.createLinearGradient(0, 20 * dpr, wallX, groundY);
    wallGrad.addColorStop(0, '#272730');
    wallGrad.addColorStop(1, '#141418');
    ctx.fillStyle = wallGrad;
    ctx.strokeStyle = '#3f3f4e';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(0, 20 * dpr, wallX, groundY - 20 * dpr, 4 * dpr);
    ctx.fill();
    ctx.stroke();

    const scale = 75 * dpr;
    const centerScreenX = w * 0.52;
    const cartX = centerScreenX + data.actual * scale;
    const cartW = 72 * dpr;
    const cartH = 38 * dpr;
    const cartY = groundY - cartH - 4 * dpr;

    // Spring (Cyan high-tension coil)
    const springStartX = wallX;
    const springEndX = cartX;
    const springY = cartY + cartH * 0.35;
    const coils = 14;
    const springLen = springEndX - springStartX;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(springStartX, springY);
    for (let i = 0; i <= coils; i++) {
      const sx = springStartX + (i / coils) * springLen;
      const dy = i === 0 || i === coils ? 0 : i % 2 === 1 ? -8 * dpr : 8 * dpr;
      ctx.lineTo(sx, springY + dy);
    }
    ctx.stroke();

    // Hydraulic Damper Assembly
    const damperY = cartY + cartH * 0.72;
    const cylinderLen = 46 * dpr;
    const cylinderW = 12 * dpr;
    ctx.fillStyle = '#181820';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(wallX + 8 * dpr, damperY - cylinderW / 2, cylinderLen, cylinderW, 3 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(wallX + 8 * dpr + cylinderLen * 0.6, damperY);
    ctx.lineTo(cartX, damperY);
    ctx.stroke();

    // Target Setpoint Ghost Box (Amber dashed)
    const targetCartX = centerScreenX + data.setpoint * scale;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(targetCartX, cartY, cartW, cartH, 6 * dpr);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cart Body (Machined Aluminum Carriage)
    const cartGrad = ctx.createLinearGradient(cartX, cartY, cartX + cartW, cartY + cartH);
    cartGrad.addColorStop(0, '#1e293b');
    cartGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = cartGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.roundRect(cartX, cartY, cartW, cartH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    // Cart Linear Bearing Blocks
    ctx.fillStyle = '#475569';
    ctx.fillRect(cartX + 8 * dpr, groundY - 4 * dpr, 14 * dpr, 4 * dpr);
    ctx.fillRect(cartX + cartW - 22 * dpr, groundY - 4 * dpr, 14 * dpr, 4 * dpr);

    // Force Vector Arrow
    if (Math.abs(data.u) > 0.1) {
      const arrowLen = Math.max(Math.min(data.u * 3.5 * dpr, 60 * dpr), -60 * dpr);
      const startX = cartX + cartW / 2;
      const startY = cartY + cartH / 2;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + arrowLen, startY);
      ctx.stroke();
    }

    // Modern HUD Overlay Card
    ctx.font = `${9 * dpr}px ui-monospace, SFMono-Regular, monospace`;
    const cardW = 165 * dpr;
    const cardH = 54 * dpr;
    ctx.fillStyle = 'rgba(18, 18, 24, 0.85)';
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.6)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.roundRect(14 * dpr, 14 * dpr, cardW, cardH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('MASS-SPRING-DAMPER (CART)', 22 * dpr, 20 * dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`POSITION: ${data.actual.toFixed(3)} m`, 22 * dpr, 34 * dpr);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`TARGET: ${data.setpoint.toFixed(2)} m`, 22 * dpr, 48 * dpr);

    const rCardW = 160 * dpr;
    ctx.fillStyle = 'rgba(18, 18, 24, 0.85)';
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.6)';
    ctx.beginPath();
    ctx.roundRect(w - rCardW - 14 * dpr, 14 * dpr, rCardW, cardH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`VELOCITY: ${data.velocity.toFixed(3)} m/s`, w - rCardW - 6 * dpr, 20 * dpr);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`FORCE u: ${data.u.toFixed(2)} N`, w - rCardW - 6 * dpr, 34 * dpr);
  }
}
