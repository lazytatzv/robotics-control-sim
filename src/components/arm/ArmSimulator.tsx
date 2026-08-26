import React, { useState, useRef, useEffect } from 'react';
import { ArmRenderer } from '../../renderers/arm';

export const ArmSimulator: React.FC = () => {
  const [l1, setL1] = useState<number>(1.2);
  const [l2, setL2] = useState<number>(1.0);
  const [elbowUp, setElbowUp] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ArmRenderer | null>(null);

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new ArmRenderer(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    rendererRef.current?.setLengths(l1, l2);
    rendererRef.current?.setElbowUp(elbowUp);
  }, [l1, l2, elbowUp]);

  useEffect(() => {
    const handleResize = () => {
      rendererRef.current?.handleResize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      rendererRef.current?.render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <main>
      <aside className="sidebar card">
        <div className="section-title">
          <span>2-DOF Arm Geometry Parameters</span>
        </div>

        <div className="form-group">
          <label>
            Link 1 Length L1 [m]: <span className="val">{l1.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={l1}
            onChange={(e) => setL1(parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>
            Link 2 Length L2 [m]: <span className="val">{l2.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={l2}
            onChange={(e) => setL2(parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Elbow Configuration</label>
          <select
            value={elbowUp ? 'up' : 'down'}
            onChange={(e) => setElbowUp(e.target.value === 'up')}
          >
            <option value="down">Elbow Down</option>
            <option value="up">Elbow Up</option>
          </select>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <p>💡 <strong>Usage:</strong> Drag or click the orange target point on the viewport. The Rust WebAssembly Inverse Kinematics (IK) solver computes joint angles θ1, θ2 in real time at 60 FPS.</p>
        </div>
      </aside>

      <section className="viewport-grid">
        <div className="canvas-container" style={{ height: '560px' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </section>
    </main>
  );
};
