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
        title: 'SCOPE 01 // TIME RESPONSE [ r(t) vs y(t) ]',
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
        { name: 'TARGET r(t)', color: '#525252', getValue: (d) => d.setpoint, dashed: true, lineWidth: 1 },
        { name: 'OUTPUT y(t)', color: '#ffffff', getValue: (d) => d.actual, lineWidth: 1.5 },
      ]);
    }
  }, [history]);

  return (
    <div className="canvas-panel canvas-panel-graph">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
