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
      <aside className="sidebar">
        <div className="control-section">
          <div className="section-label">Geometry Parameters</div>

          <div className="form-group">
            <label>
              Link 1 (L1) <span className="val">{l1.toFixed(1)} m</span>
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
              Link 2 (L2) <span className="val">{l2.toFixed(1)} m</span>
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
            <label>Elbow Solution</label>
            <select
              value={elbowUp ? 'up' : 'down'}
              onChange={(e) => setElbowUp(e.target.value === 'up')}
            >
              <option value="down">Elbow Down</option>
              <option value="up">Elbow Up</option>
            </select>
          </div>

          <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Drag the amber target crosshair on the viewport to solve inverse kinematics in real time via Rust WebAssembly.
          </div>
        </div>
      </aside>

      <section className="viewport-deck">
        <div className="canvas-panel" style={{ height: 'calc(100vh - 49px)' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </section>
    </main>
  );
};
