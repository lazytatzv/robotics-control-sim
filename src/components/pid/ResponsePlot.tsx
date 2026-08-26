import React, { useRef, useEffect } from 'react';
import { CanvasPlotter } from '../../renderers/plot';
import { StepDataPoint } from '../../sim-bridge';

interface ResponsePlotProps {
  history: StepDataPoint[];
}

export const ResponsePlot: React.FC<ResponsePlotProps> = ({ history }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plotterRef = useRef<CanvasPlotter | null>(null);

  useEffect(() => {
    if (canvasRef.current && !plotterRef.current) {
      plotterRef.current = new CanvasPlotter(canvasRef.current, {
        title: 'TIME RESPONSE: SETPOINT r(t) VS OUTPUT y(t)',
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
        { name: 'r(t)', color: '#f59e0b', getValue: (d) => d.setpoint, dashed: true },
        { name: 'y(t)', color: '#38bdf8', getValue: (d) => d.actual },
      ]);
    }
  }, [history]);

  return (
    <div className="canvas-panel canvas-panel-plot">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
