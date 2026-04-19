import React, { useState, useEffect, useRef } from 'react';
import '../styles/Onboarding.css';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: '✨ Generate Random Patches',
    description: 'Click the Random button to generate new synthesis patches. Each one is unique!',
    targetSelector: '[data-onboarding="random-btn"]',
    position: 'bottom',
  },
  {
    id: 2,
    title: '▶️ Play to Hear',
    description: 'Press Play to hear your patch. Listen to the spectrum visualization update in real-time.',
    targetSelector: '[data-onboarding="play-btn"]',
    position: 'bottom',
  },
  {
    id: 3,
    title: '🧬 Switch to Evolve',
    description: 'The Evolve tab uses genetic algorithms to improve patches automatically. Watch AI create better sounds!',
    targetSelector: '[data-onboarding="evolve-tab"]',
    position: 'bottom',
  },
];

const STORAGE_KEY = 'harmonic-onboarding-seen';
const STORAGE_DISMISSED_KEY = 'harmonic-onboarding-dismissed';

interface OnboardingProps {
  onDismiss?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onDismiss }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [targetPos, setTargetPos] = useState<{ top: number; left: number; width: number; height: number } | null>(
    null
  );
  const overlayRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if onboarding was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_DISMISSED_KEY);
    if (dismissed === 'true') {
      return;
    }

    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Show onboarding on first load
      setTimeout(() => setIsVisible(true), 500);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  // Update target position on each step change
  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const step = STEPS[currentStep];
      const target = document.querySelector(step.targetSelector) as HTMLElement;

      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetPos({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    if (neverShowAgain) {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    }
    setIsVisible(false);
    onDismiss?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleDismiss();
    } else if (e.key === 'Enter' || e.key === ' ') {
      handleNext();
    }
  };

  if (!isVisible || !targetPos) {
    return null;
  }

  const step = STEPS[currentStep];
  const padding = 12;
  let tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10001,
  };

  // Calculate tooltip position based on where we want it relative to target
  switch (step.position) {
    case 'top':
      tooltipStyle.top = targetPos.top - 200;
      tooltipStyle.left = targetPos.left + targetPos.width / 2 - 150;
      break;
    case 'bottom':
      tooltipStyle.top = targetPos.top + targetPos.height + padding;
      tooltipStyle.left = targetPos.left + targetPos.width / 2 - 150;
      break;
    case 'left':
      tooltipStyle.top = targetPos.top + targetPos.height / 2 - 60;
      tooltipStyle.left = targetPos.left - 320;
      break;
    case 'right':
      tooltipStyle.top = targetPos.top + targetPos.height / 2 - 60;
      tooltipStyle.left = targetPos.left + targetPos.width + padding;
      break;
  }

  return (
    <>
      {/* Dark overlay */}
      <div
        ref={overlayRef}
        className="onboarding-overlay animate-overlay-fade"
        onClick={handleDismiss}
        role="presentation"
      />

      {/* Highlight spotlight on target */}
      <div
        ref={highlightRef}
        className="onboarding-highlight animate-highlight-pulse"
        style={{
          top: targetPos.top - 8,
          left: targetPos.left - 8,
          width: targetPos.width + 16,
          height: targetPos.height + 16,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="onboarding-tooltip animate-popup-scale-in"
        style={tooltipStyle}
        role="dialog"
        aria-label={`Onboarding step ${currentStep + 1}`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="tooltip-header">
          <h3>{step.title}</h3>
          <button
            className="tooltip-close"
            onClick={handleDismiss}
            aria-label="Close onboarding"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <p className="tooltip-description">{step.description}</p>

        <div className="tooltip-footer">
          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={(e) => setNeverShowAgain(e.target.checked)}
              aria-label="Never show onboarding again"
            />
            <span>Don't show again</span>
          </label>

          <div className="tooltip-buttons">
            <button className="btn-tooltip-secondary" onClick={handleDismiss}>
              {currentStep === STEPS.length - 1 ? 'Done' : 'Skip'}
            </button>
            <button className="btn-tooltip-primary" onClick={handleNext}>
              {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'} →
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
              aria-current={i === currentStep ? 'step' : undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Onboarding;
