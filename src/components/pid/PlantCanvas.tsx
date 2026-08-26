import React, { useRef, useEffect } from 'react';
import { PlantRenderer } from '../../renderers/plant';
import { StepDataPoint } from '../../sim-bridge';

interface PlantCanvasProps {
  data: StepDataPoint | null;
  plantType: 'motor_pos' | 'motor_velocity' | 'cart';
}

export const PlantCanvas: React.FC<PlantCanvasProps> = ({ data, plantType }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PlantRenderer | null>(null);

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new PlantRenderer(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      rendererRef.current?.handleResize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (data && rendererRef.current) {
      if (plantType === 'cart') {
        rendererRef.current.renderCart(data);
      } else {
        rendererRef.current.renderMotor(data, plantType === 'motor_velocity');
      }
    }
  }, [data, plantType]);

  return (
    <div className="canvas-panel canvas-panel-anim">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
