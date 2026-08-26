import React, { useRef, useEffect, useCallback } from 'react';
import { PlantRenderer } from '../../renderers/plant';
import { StepDataPoint } from '../../sim-bridge';

interface PlantCanvasProps {
  data: StepDataPoint | null;
  plantType: 'motor_pos' | 'motor_velocity' | 'cart';
  onTargetChange?: (newTarget: number) => void;
}

export const PlantCanvas: React.FC<PlantCanvasProps> = ({ data, plantType, onTargetChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PlantRenderer | null>(null);
  const isDraggingRef = useRef<boolean>(false);

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

  const handlePointerAction = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current || !onTargetChange) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      if (plantType === 'motor_pos') {
        const cx = rect.width * 0.5;
        const cy = rect.height * 0.5;
        const dx = px - cx;
        const dy = cy - py; // Cartesian Y up
        const angle = Math.atan2(dy, dx);
        onTargetChange(parseFloat(angle.toFixed(2)));
      } else if (plantType === 'cart') {
        const centerScreenX = rect.width * 0.52;
        const scale = 70; // 70px per meter
        const targetMeters = (px - centerScreenX) / scale;
        const clamped = Math.max(-2.5, Math.min(2.5, targetMeters));
        onTargetChange(parseFloat(clamped.toFixed(2)));
      }
    },
    [plantType, onTargetChange]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (plantType === 'motor_velocity') return;
    isDraggingRef.current = true;
    handlePointerAction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    handlePointerAction(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (plantType === 'motor_velocity' || e.touches.length === 0) return;
    isDraggingRef.current = true;
    handlePointerAction(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    handlePointerAction(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="canvas-panel canvas-panel-machinery" style={{ cursor: plantType !== 'motor_velocity' ? 'crosshair' : 'default' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};
