import React, { useRef, useEffect } from 'react';
import { CanvasPlotter } from '../../renderers/plot';
import { StepDataPoint } from '../../sim-bridge';

interface ControlPlotProps {
  history: StepDataPoint[];
}

export const ControlPlot: React.FC<ControlPlotProps> = ({ history }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plotterRef = useRef<CanvasPlotter | null>(null);

  useEffect(() => {
    if (canvasRef.current && !plotterRef.current) {
      plotterRef.current = new CanvasPlotter(canvasRef.current, {
        title: '制御入力 u(t) および 各項成分 (P, I, D)',
      });
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      plotterRef.current?.handleResize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (plotterRef.current && history.length > 0) {
      plotterRef.current.render(history, [
        { name: '操作量 u(t)', color: '#ec4899', getValue: (d) => d.u, lineWidth: 2.5 },
        { name: 'P項', color: '#38bdf8', getValue: (d) => d.p_term, dashed: true, lineWidth: 1.2 },
        { name: 'I項', color: '#a855f7', getValue: (d) => d.i_term, dashed: true, lineWidth: 1.2 },
        { name: 'D項', color: '#10b981', getValue: (d) => d.d_term, dashed: true, lineWidth: 1.2 },
      ]);
    }
  }, [history]);

  return (
    <div className="canvas-container canvas-plot">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
