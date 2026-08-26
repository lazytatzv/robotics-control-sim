import { BodeAnalysis } from '../sim-bridge';

export class BodePlotter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for BodePlotter');
    this.ctx = ctx;
    this.handleResize();
  }

  public handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
  }

  public render(analysis: BodeAnalysis | null): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!analysis || analysis.points.length === 0) {
      ctx.fillStyle = '#52525b';
      ctx.font = `${10 * dpr}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('NO FREQUENCY RESPONSE DATA', w / 2, h / 2);
      return;
    }

    const padLeft = 52 * dpr;
    const padRight = 24 * dpr;
    const padTop = 26 * dpr;
    const padBottom = 22 * dpr;
    const gapH = 18 * dpr;

    const availableH = h - padTop - padBottom - gapH;
    const magH = Math.floor(availableH * 0.52);
    const phaseH = availableH - magH;
    const plotW = w - padLeft - padRight;

    const points = analysis.points;
    const wMin = points[0].omega;
    const wMax = points[points.length - 1].omega;
    const logMin = Math.log10(wMin);
    const logMax = Math.log10(wMax);

    const mapX = (omega: number) => {
      const logW = Math.log10(omega);
      return padLeft + ((logW - logMin) / (logMax - logMin)) * plotW;
    };

    // Magnitude range: -80 dB to +60 dB
    const magMin = -80;
    const magMax = 60;
    const mapMagY = (db: number) => {
      const clamped = Math.max(magMin, Math.min(magMax, db));
      return padTop + magH - ((clamped - magMin) / (magMax - magMin)) * magH;
    };

    // Phase range: -270 deg to +90 deg
    const phaseMin = -270;
    const phaseMax = 90;
    const phaseTop = padTop + magH + gapH;
    const mapPhaseY = (deg: number) => {
      const clamped = Math.max(phaseMin, Math.min(phaseMax, deg));
      return phaseTop + phaseH - ((clamped - phaseMin) / (phaseMax - phaseMin)) * phaseH;
    };

    // 1. Grid & Background
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1 * dpr;
    ctx.fillStyle = '#71717a';
    ctx.font = `${9 * dpr}px ui-monospace, monospace`;

    // Frequency decades: 0.1, 1, 10, 100, 1000
    const decades = [0.1, 1, 10, 100, 1000];
    for (const dec of decades) {
      if (dec >= wMin && dec <= wMax) {
        const x = mapX(dec);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + magH);
        ctx.moveTo(x, phaseTop);
        ctx.lineTo(x, phaseTop + phaseH);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${dec} rad/s`, x, phaseTop + phaseH + 4 * dpr);
      }
    }

    // Magnitude Y ticks (-60, -40, -20, 0, +20, +40)
    const magTicks = [-60, -40, -20, 0, 20, 40];
    for (const val of magTicks) {
      const y = mapMagY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = val === 0 ? '#38bdf8' : '#71717a';
      ctx.fillText(`${val}dB`, padLeft - 6 * dpr, y);
    }

    // Phase Y ticks (-270, -180, -90, 0)
    const phaseTicks = [-270, -180, -90, 0];
    for (const val of phaseTicks) {
      const y = mapPhaseY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = val === -180 ? '#f43f5e' : '#71717a';
      ctx.fillText(`${val}°`, padLeft - 6 * dpr, y);
    }

    // 0 dB Highlight Line
    const y0dB = mapMagY(0);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.moveTo(padLeft, y0dB);
    ctx.lineTo(w - padRight, y0dB);
    ctx.stroke();

    // -180 deg Highlight Line
    const y180 = mapPhaseY(-180);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.moveTo(padLeft, y180);
    ctx.lineTo(w - padRight, y180);
    ctx.stroke();

    // 2. Open-Loop Magnitude Trace (Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = mapX(points[i].omega);
      const y = mapMagY(points[i].mag_db);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Closed-Loop -3dB Magnitude Trace (Gray Dashed)
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.2 * dpr;
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = mapX(points[i].omega);
      const y = mapMagY(points[i].closed_loop_mag_db);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Phase Trace (Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = mapX(points[i].omega);
      const y = mapPhaseY(points[i].phase_deg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Stability Markers (Crossover & Margins)
    if (analysis.gain_crossover_freq && analysis.phase_margin_deg !== undefined) {
      const wGc = analysis.gain_crossover_freq;
      const xGc = mapX(wGc);
      const yMagGc = mapMagY(0);
      const yPhaseGc = mapPhaseY(analysis.phase_margin_deg - 180);

      // Marker line at omega_gc
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([3 * dpr, 2 * dpr]);
      ctx.beginPath();
      ctx.moveTo(xGc, yMagGc);
      ctx.lineTo(xGc, yPhaseGc);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(xGc, yMagGc, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    if (analysis.phase_crossover_freq && analysis.gain_margin_db !== undefined) {
      const wPc = analysis.phase_crossover_freq;
      const xPc = mapX(wPc);
      const yPhasePc = mapPhaseY(-180);
      const yMagPc = mapMagY(-analysis.gain_margin_db);

      // Marker line at omega_pc
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([3 * dpr, 2 * dpr]);
      ctx.beginPath();
      ctx.moveTo(xPc, yMagPc);
      ctx.lineTo(xPc, yPhasePc);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(xPc, yPhasePc, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Titles & Header Overlay
    ctx.fillStyle = '#71717a';
    ctx.font = `600 ${9 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('BODE MAGNITUDE // |L(jω)| [dB] (CYAN) & |T(jω)| (GRAY)', padLeft, 7 * dpr);
    ctx.fillText('BODE PHASE // ∠L(jω) [deg] (AMBER)', padLeft, phaseTop - 13 * dpr);

    // Margins Summary Banner on top right
    const pmStr = analysis.phase_margin_deg !== undefined ? `${analysis.phase_margin_deg.toFixed(1)}°` : 'N/A';
    const gmStr = analysis.gain_margin_db !== undefined ? `${analysis.gain_margin_db.toFixed(1)} dB` : '∞';
    const bwStr = analysis.bandwidth ? `${analysis.bandwidth.toFixed(1)} rad/s` : '--';
    const stabLabel = analysis.is_stable ? '● STABLE' : '▲ UNSTABLE';
    const stabColor = analysis.is_stable ? '#22c55e' : '#ef4444';

    ctx.textAlign = 'right';
    ctx.fillStyle = stabColor;
    ctx.font = `700 ${9 * dpr}px ui-monospace, monospace`;
    ctx.fillText(stabLabel, w - padRight, 7 * dpr);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = `500 ${8.5 * dpr}px ui-monospace, monospace`;
    ctx.fillText(`PM: ${pmStr}  |  GM: ${gmStr}  |  BW: ${bwStr}`, w - padRight - 70 * dpr, 7 * dpr);
  }
}
