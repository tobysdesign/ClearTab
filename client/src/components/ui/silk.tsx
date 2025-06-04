import React from "react";

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
  children?: React.ReactNode;
}

const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
  className = "",
  children
}) => {
  const animationDuration = `${20 / speed}s`;
  const scaleValue = scale;
  const rotationValue = `${rotation}deg`;

  return (
    <div className={`relative ${className}`}>
      <div 
        className="fixed inset-0 -z-10 silk-pattern"
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: `
            radial-gradient(circle at 25% 25%, ${color}20 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, ${color}15 0%, transparent 50%),
            radial-gradient(circle at 75% 25%, ${color}10 0%, transparent 50%),
            radial-gradient(circle at 25% 75%, ${color}10 0%, transparent 50%)
          `,
          backgroundSize: `${400 * scaleValue}px ${400 * scaleValue}px, ${300 * scaleValue}px ${300 * scaleValue}px, ${500 * scaleValue}px ${500 * scaleValue}px, ${500 * scaleValue}px ${500 * scaleValue}px`,
          backgroundPosition: '0% 0%, 100% 100%, 100% 0%, 0% 100%',
          transform: `rotate(${rotationValue})`,
          animation: `silk-flow ${animationDuration} ease-in-out infinite`,
          opacity: 0.8 + (noiseIntensity * 0.1)
        }}
      />
      {children}
    </div>
  );
};

export default Silk;