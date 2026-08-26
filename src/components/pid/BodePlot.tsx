import React, { useRef, useEffect } from 'react';
import { BodePlotter } from '../../renderers/bode';
import { BodeAnalysis } from '../../sim-bridge';

interface BodePlotProps {
  analysis: BodeAnalysis | null;
}

export const BodePlot: React.FC<BodePlotProps> = ({ analysis }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plotterRef = useRef<BodePlotter | null>(null);

  useEffect(() => {
    if (canvasRef.current && !plotterRef.current) {
      plotterRef.current = new BodePlotter(canvasRef.current);
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
