import React, { useEffect, useState } from 'react';
import '../styles/ProgressBar.css';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showPercentage = true,
  color = 'var(--primary)',
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((current / max) * 100, 100);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(percentage);
      return;
    }

    let animationFrame: number;
    const animate = (start: number) => {
      const diff = percentage - start;
      const duration = 300; // ms
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + diff * progress;
        setDisplayValue(current);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
        }
      };

      animationFrame = requestAnimationFrame(step);
    };

    animate(displayValue);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [percentage, animated]);

  return (
    <div className="progress-bar-container">
      {label && <label className="progress-label">{label}</label>}
      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${displayValue}%`,
              background: color,
            }}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
        {showPercentage && (
          <span className="progress-text" aria-label={`${Math.round(percentage)}% complete`}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
