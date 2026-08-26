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
          <span>2自由度アーム 幾何パラメータ</span>
        </div>

        <div className="form-group">
          <label>
            リンク1 長さ L1 [m]: <span className="val">{l1.toFixed(1)}</span>
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
            リンク2 長さ L2 [m]: <span className="val">{l2.toFixed(1)}</span>
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
          <label>姿勢解の選択 (Elbow Configuration)</label>
          <select
            value={elbowUp ? 'up' : 'down'}
            onChange={(e) => setElbowUp(e.target.value === 'up')}
          >
            <option value="down">Elbow Down (下肘)</option>
            <option value="up">Elbow Up (上肘)</option>
          </select>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <p>💡 <strong>操作方法:</strong> 右側のキャンバス上でオレンジ色のターゲット点をマウスドラッグ（またはタップ移動）すると、Rust Wasm の逆運動学（IK）ソルバーが関節角度 θ1, θ2 をリアルタイム逆算します。</p>
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
