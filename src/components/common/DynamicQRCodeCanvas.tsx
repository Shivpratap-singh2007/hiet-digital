import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface DynamicQRCodeCanvasProps {
  value: string;
  size?: number;
  className?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const DynamicQRCodeCanvas: React.FC<DynamicQRCodeCanvasProps> = ({
  value,
  size = 220,
  className = '',
  errorCorrectionLevel = 'M'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel
      },
      (error) => {
        if (error) {
          console.error('QR Code render error:', error);
        }
      }
    );
  }, [value, size, errorCorrectionLevel]);

  return (
    <div className={`inline-flex items-center justify-center bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 dark:border-white/10 ${className}`}>
      <canvas ref={canvasRef} width={size} height={size} className="rounded-xl block" />
    </div>
  );
};
