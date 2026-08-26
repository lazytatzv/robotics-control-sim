import { NyquistAnalysis } from '../sim-bridge';

export class NyquistPlotter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for NyquistPlotter');
    this.ctx = ctx;
    this.handleResize();
  }

  public handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
  }

  public render(analysis: NyquistAnalysis | null): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!analysis || analysis.positive_freq_points.length === 0) {
      ctx.fillStyle = '#52525b';
      ctx.font = `${10 * dpr}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('NO NYQUIST DATA', w / 2, h / 2);
      return;
    }

    const pad = 40 * dpr;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    // View range on complex plane [-3.0, +2.0] Re, [-2.5, +2.5] Im
    const reMin = -3.0;
    const reMax = 2.0;
    const imMin = -2.5;
    const imMax = 2.5;

    const mapX = (re: number) => pad + ((re - reMin) / (reMax - reMin)) * plotW;
    const mapY = (im: number) => pad + plotH - ((im - imMin) / (imMax - imMin)) * plotH;

    const originX = mapX(0);
    const originY = mapY(0);
    const critX = mapX(-1);
    const critY = mapY(0);

    // 1. Grid & Axes
    ctx.strokeStyle = '#1e1e24';
    ctx.lineWidth = 1 * dpr;

    // Concentric magnitude circles (0.5, 1.0, 2.0)
    const unitRadius = (plotW / (reMax - reMin)) * 1.0;
    ctx.strokeStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(originX, originY, unitRadius * 0.5, 0, Math.PI * 2);
    ctx.arc(originX, originY, unitRadius * 1.0, 0, Math.PI * 2);
    ctx.arc(originX, originY, unitRadius * 2.0, 0, Math.PI * 2);
    ctx.stroke();

    // Coordinate Axes
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    // Real Axis
    ctx.moveTo(pad, originY);
    ctx.lineTo(w - pad, originY);
    // Imaginary Axis
    ctx.moveTo(originX, pad);
    ctx.lineTo(originX, h - pad);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#71717a';
    ctx.font = `${8.5 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let r = -2; r <= 1; r++) {
      if (r !== 0) {
        const x = mapX(r);
        ctx.fillText(`${r}`, x, originY + 4 * dpr);
      }
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = -2; i <= 2; i++) {
      if (i !== 0) {
        const y = mapY(i);
        ctx.fillText(`${i}j`, originX - 6 * dpr, y);
      }
    }

    // Unit Circle Label
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('|L| = 1.0 (UNIT CIRCLE)', originX + unitRadius * 0.72, originY - unitRadius * 0.72);

    // 2. Critical Point (-1, 0j)
    ctx.strokeStyle = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.lineWidth = 2 * dpr;
    const crossSize = 6 * dpr;
    ctx.beginPath();
    ctx.moveTo(critX - crossSize, critY - crossSize);
    ctx.lineTo(critX + crossSize, critY + crossSize);
    ctx.moveTo(critX - crossSize, critY + crossSize);
    ctx.lineTo(critX + crossSize, critY - crossSize);
    ctx.stroke();

    ctx.font = `bold ${9 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('(-1, 0j) CRITICAL', critX, critY - 8 * dpr);

    // 3. Mirror Negative Frequency Locus (Gray/Amber Dashed)
    const negPts = analysis.negative_freq_points;
    ctx.strokeStyle = 'rgba(161, 161, 170, 0.4)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.beginPath();
    for (let i = 0; i < negPts.length; i++) {
      const x = mapX(negPts[i].re);
      const y = mapY(negPts[i].im);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Positive Frequency Locus (Cyan Solid)
    const posPts = analysis.positive_freq_points;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    for (let i = 0; i < posPts.length; i++) {
      const x = mapX(posPts[i].re);
      const y = mapY(posPts[i].im);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Direction arrow on positive locus (near mid frequency)
    if (posPts.length > 30) {
      const midIdx = Math.floor(posPts.length * 0.4);
      const p1 = posPts[midIdx];
      const p2 = posPts[midIdx + 1];
      const x1 = mapX(p1.re);
      const y1 = mapY(p1.im);
      const x2 = mapX(p2.re);
      const y2 = mapY(p2.im);
      const angle = Math.atan2(y2 - y1, x2 - x1);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * dpr * Math.cos(angle - Math.PI / 6), y2 - 8 * dpr * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - 8 * dpr * Math.cos(angle + Math.PI / 6), y2 - 8 * dpr * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    // 5. Header Overlay & Stability Status
    ctx.fillStyle = '#71717a';
    ctx.font = `600 ${9 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('NYQUIST DIAGRAM // COMPLEX FREQUENCY LOCUS L(jω)', pad, 12 * dpr);

    const stabLabel = analysis.is_stable ? '● STABLE (NO ENCIRCLEMENT)' : '▲ UNSTABLE (ENCIRCLES -1)';
    const stabColor = analysis.is_stable ? '#22c55e' : '#ef4444';

    ctx.textAlign = 'right';
    ctx.fillStyle = stabColor;
    ctx.font = `700 ${9.5 * dpr}px ui-monospace, monospace`;
    ctx.fillText(stabLabel, w - pad, 12 * dpr);
  }
}
