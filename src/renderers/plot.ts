import { StepDataPoint } from '../sim-bridge';

export interface PlotOptions {
  title: string;
  yMin?: number;
  yMax?: number;
  autoScale?: boolean;
  unit?: string;
  showZeroLine?: boolean;
  saturationLimits?: { min: number; max: number };
}

export class CanvasPlotter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: PlotOptions;

  constructor(canvas: HTMLCanvasElement, options: PlotOptions) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;
    this.options = {
      autoScale: true,
      showZeroLine: true,
      ...options,
    };
    this.handleResize();
  }

  public handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
  }

  public render(
    history: StepDataPoint[],
    series: Array<{
      name: string;
      color: string;
      getValue: (d: StepDataPoint) => number;
      dashed?: boolean;
      lineWidth?: number;
    }>
  ): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (history.length === 0) return;

    const padLeft = 50 * dpr;
    const padRight = 20 * dpr;
    const padTop = 30 * dpr;
    const padBottom = 30 * dpr;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Time range (X-axis)
    const tMin = history[0].t;
    const tMax = Math.max(history[history.length - 1].t, tMin + 0.1);

    // Value range (Y-axis)
    let yMin = this.options.yMin ?? Infinity;
    let yMax = this.options.yMax ?? -Infinity;

    if (this.options.autoScale) {
      for (const d of history) {
        for (const s of series) {
          const val = s.getValue(d);
          if (!isNaN(val) && isFinite(val)) {
            if (val < yMin) yMin = val;
            if (val > yMax) yMax = val;
          }
        }
      }
      if (this.options.saturationLimits) {
        yMin = Math.min(yMin, this.options.saturationLimits.min);
        yMax = Math.max(yMax, this.options.saturationLimits.max);
      }
      if (yMin === Infinity || yMax === -Infinity) {
        yMin = -1;
        yMax = 1;
      }
      // Add 10% padding
      const range = Math.max(yMax - yMin, 0.1);
      yMin -= range * 0.08;
      yMax += range * 0.08;
    }

    const mapX = (t: number) => padLeft + ((t - tMin) / (tMax - tMin)) * plotW;
    const mapY = (val: number) => padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

    // Draw background grid
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1 * dpr;
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = `${10 * dpr}px sans-serif`;

    // Horizontal grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = yMin + (i / yTicks) * (yMax - yMin);
      const y = mapY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(1), padLeft - 6 * dpr, y);
    }

    // Vertical grid lines
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const t = tMin + (i / xTicks) * (tMax - tMin);
      const x = mapX(t);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${t.toFixed(1)}s`, x, padTop + plotH + 6 * dpr);
    }

    // Draw Zero line
    if (this.options.showZeroLine && yMin <= 0 && yMax >= 0) {
      const yZero = mapY(0);
      ctx.strokeStyle = '#475569'; // slate-600
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(padLeft, yZero);
      ctx.lineTo(w - padRight, yZero);
      ctx.stroke();
    }

    // Draw Saturation Limits if specified
    if (this.options.saturationLimits) {
      const { min: satMin, max: satMax } = this.options.saturationLimits;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // red-500
      ctx.lineWidth = 1.2 * dpr;

      // Max Saturation
      const yMaxSat = mapY(satMax);
      ctx.beginPath();
      ctx.moveTo(padLeft, yMaxSat);
      ctx.lineTo(w - padRight, yMaxSat);
      ctx.stroke();

      // Min Saturation
      const yMinSat = mapY(satMin);
      ctx.beginPath();
      ctx.moveTo(padLeft, yMinSat);
      ctx.lineTo(w - padRight, yMinSat);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw data series
    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = (s.lineWidth ?? 2) * dpr;
      if (s.dashed) {
        ctx.setLineDash([6 * dpr, 3 * dpr]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      let first = true;
      for (const d of history) {
        const x = mapX(d.t);
        const y = mapY(s.getValue(d));
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Plot Title and Unit
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.font = `bold ${12 * dpr}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.options.title, padLeft, 8 * dpr);

    // Draw Legend in upper right
    let legendX = w - padRight;
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = 'right';
    for (let i = series.length - 1; i >= 0; i--) {
      const s = series[i];
      const latestVal = history.length > 0 ? s.getValue(history[history.length - 1]).toFixed(2) : '--';
      const label = `${s.name}: ${latestVal}`;
      
      ctx.fillStyle = s.color;
      ctx.fillText(label, legendX, 8 * dpr);
      legendX -= (ctx.measureText(label).width + 16 * dpr);
    }
  }
}
