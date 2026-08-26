import React, { useRef, useEffect } from 'react';
import { NyquistPlotter } from '../../renderers/nyquist';
import { NyquistAnalysis } from '../../sim-bridge';

interface NyquistPlotProps {
  analysis: NyquistAnalysis | null;
}

export const NyquistPlot: React.FC<NyquistPlotProps> = ({ analysis }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plotterRef = useRef<NyquistPlotter | null>(null);

  useEffect(() => {
    if (canvasRef.current && !plotterRef.current) {
      plotterRef.current = new NyquistPlotter(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      plotterRef.current?.handleResize();
      if (plotterRef.current) {
        plotterRef.current.render(analysis);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [analysis]);

  useEffect(() => {
    if (plotterRef.current) {
      plotterRef.current.render(analysis);
    }
  }, [analysis]);

  return (
    <div className="canvas-panel canvas-panel-bode">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
