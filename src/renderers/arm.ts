import { arm2_fk, arm2_ik } from '../sim-bridge';

export class ArmRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private l1: number = 1.2;
  private l2: number = 1.0;
  private targetX: number = 1.2;
  private targetY: number = 0.8;
  private elbowUp: boolean = false;
  private isDragging: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;

    this.setupEvents();
    this.handleResize();
  }

  public handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
  }

  public setLengths(l1: number, l2: number): void {
    this.l1 = l1;
    this.l2 = l2;
  }

  public setElbowUp(elbowUp: boolean): void {
    this.elbowUp = elbowUp;
  }

  private setupEvents(): void {
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      const dpr = window.devicePixelRatio || 1;
      const cx = (this.canvas.width / dpr) / 2;
      const cy = (this.canvas.height / dpr) * 0.8;
      const scale = 110;

      const worldX = (px - cx) / scale;
      const worldY = (cy - py) / scale;
      return { worldX, worldY };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      this.isDragging = true;
      const { worldX, worldY } = getPos(e);
      this.targetX = worldX;
      this.targetY = worldY;
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return;
      const { worldX, worldY } = getPos(e);
      this.targetX = worldX;
      this.targetY = worldY;
    };

    const onUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    this.canvas.addEventListener('touchstart', onDown);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  }

  public render(): { theta1Deg: number; theta2Deg: number; reachable: boolean } {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.8;
    const scale = 110 * dpr;

    // Reach envelope
    const maxReach = (this.l1 + this.l2) * scale;
    const minReach = Math.abs(this.l1 - this.l2) * scale;

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1 * dpr;
    ctx.setLineDash([3 * dpr, 3 * dpr]);
    ctx.beginPath();
    ctx.arc(cx, cy, maxReach, 0, Math.PI * 2);
    ctx.stroke();
    if (minReach > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, minReach, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const ikResult = arm2_ik(this.l1, this.l2, this.targetX, this.targetY, this.elbowUp) as [number, number] | undefined;
    const reachable = ikResult !== undefined && ikResult !== null;

    let theta1 = 0;
    let theta2 = 0;

    if (reachable) {
      theta1 = ikResult[0];
      theta2 = ikResult[1];
    } else {
      theta1 = Math.atan2(this.targetY, this.targetX);
      theta2 = 0;
    }

    const [elbowX, elbowY, eeX, eeY] = arm2_fk(this.l1, this.l2, theta1, theta2) as [number, number, number, number];

    const baseScr = { x: cx, y: cy };
    const elbowScr = { x: cx + elbowX * scale, y: cy - elbowY * scale };
    const eeScr = { x: cx + eeX * scale, y: cy - eeY * scale };
    const targetScr = { x: cx + this.targetX * scale, y: cy - this.targetY * scale };

    // Base pedestal
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5 * dpr;
    ctx.fillRect(cx - 25 * dpr, cy, 50 * dpr, 14 * dpr);
    ctx.strokeRect(cx - 25 * dpr, cy, 50 * dpr, 14 * dpr);

    // Link 1
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5 * dpr;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseScr.x, baseScr.y);
    ctx.lineTo(elbowScr.x, elbowScr.y);
    ctx.stroke();

    // Link 2
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(elbowScr.x, elbowScr.y);
    ctx.lineTo(eeScr.x, eeScr.y);
    ctx.stroke();

    // Joints
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(baseScr.x, baseScr.y, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#818cf8';
    ctx.beginPath();
    ctx.arc(elbowScr.x, elbowScr.y, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // End Effector
    ctx.fillStyle = reachable ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(eeScr.x, eeScr.y, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Target crosshair
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(targetScr.x, targetScr.y, 8 * dpr, 0, Math.PI * 2);
    ctx.stroke();

    // HUD Telemetry
    ctx.fillStyle = '#71717a';
    ctx.font = `${9 * dpr}px ui-monospace, SFMono-Regular, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`TARGET: (${this.targetX.toFixed(2)}, ${this.targetY.toFixed(2)}) m`, 12 * dpr, 16 * dpr);
    ctx.fillText(`STATUS: ${reachable ? 'REACHABLE' : 'SINGULARITY / OUT OF REACH'}`, 12 * dpr, 30 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`THETA-1: ${((theta1 * 180) / Math.PI).toFixed(1)}°`, w - 12 * dpr, 16 * dpr);
    ctx.fillText(`THETA-2: ${((theta2 * 180) / Math.PI).toFixed(1)}°`, w - 12 * dpr, 30 * dpr);

    return {
      theta1Deg: (theta1 * 180) / Math.PI,
      theta2Deg: (theta2 * 180) / Math.PI,
      reachable,
    };
  }
}
