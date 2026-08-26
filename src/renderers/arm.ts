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

    // Reach boundary circles
    const maxReach = (this.l1 + this.l2) * scale;
    const minReach = Math.abs(this.l1 - this.l2) * scale;

    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, maxReach, 0, Math.PI * 2);
    ctx.stroke();
    if (minReach > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, minReach, 0, Math.PI * 2);
      ctx.stroke();
    }

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

    // Base Support
    ctx.fillStyle = '#121212';
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(cx - 20 * dpr, cy, 40 * dpr, 10 * dpr);

    // Link 1 (Solid White)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(baseScr.x, baseScr.y);
    ctx.lineTo(elbowScr.x, elbowScr.y);
    ctx.stroke();

    // Link 2 (Solid White)
    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(elbowScr.x, elbowScr.y);
    ctx.lineTo(eeScr.x, eeScr.y);
    ctx.stroke();

    // Joints
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(baseScr.x, baseScr.y, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(elbowScr.x, elbowScr.y, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // End Effector
    ctx.fillStyle = reachable ? '#ffffff' : '#525252';
    ctx.fillRect(eeScr.x - 3 * dpr, eeScr.y - 3 * dpr, 6 * dpr, 6 * dpr);

    // Target Crosshair
    ctx.strokeStyle = '#737373';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(targetScr.x - 8 * dpr, targetScr.y);
    ctx.lineTo(targetScr.x + 8 * dpr, targetScr.y);
    ctx.moveTo(targetScr.x, targetScr.y - 8 * dpr);
    ctx.lineTo(targetScr.x, targetScr.y + 8 * dpr);
    ctx.stroke();

    // Telemetry HUD
    ctx.fillStyle = '#525252';
    ctx.font = `${9 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`TARGET: [X=${this.targetX.toFixed(2)}, Y=${this.targetY.toFixed(2)}]`, 12 * dpr, 16 * dpr);
    ctx.fillText(`STATUS: ${reachable ? 'VALID_SOLUTION' : 'SINGULARITY / UNREACHABLE'}`, 12 * dpr, 28 * dpr);

    ctx.textAlign = 'right';
    ctx.fillText(`THETA_1: ${((theta1 * 180) / Math.PI).toFixed(1)}°`, w - 12 * dpr, 16 * dpr);
    ctx.fillText(`THETA_2: ${((theta2 * 180) / Math.PI).toFixed(1)}°`, w - 12 * dpr, 28 * dpr);

    return {
      theta1Deg: (theta1 * 180) / Math.PI,
      theta2Deg: (theta2 * 180) / Math.PI,
      reachable,
    };
  }
}
