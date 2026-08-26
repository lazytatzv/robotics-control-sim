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
        title: 'SCOPE 02 // CONTROL SIGNAL u(t) & DECOMPOSITION (P, I, D)',
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
        { name: 'u(t)', color: '#f43f5e', getValue: (d) => d.u, lineWidth: 2 },
        { name: 'P', color: '#60a5fa', getValue: (d) => d.p_term, dashed: true, lineWidth: 1 },
        { name: 'I', color: '#c084fc', getValue: (d) => d.i_term, dashed: true, lineWidth: 1 },
        { name: 'D', color: '#34d399', getValue: (d) => d.d_term, dashed: true, lineWidth: 1 },
      ]);
    }
  }, [history]);

  return (
    <div className="canvas-panel canvas-panel-graph">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
