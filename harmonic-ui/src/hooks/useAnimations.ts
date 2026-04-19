import { useRef, useCallback } from 'react';

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
}

export const useAnimations = () => {
  const animatingElementsRef = useRef<Set<HTMLElement>>(new Set());

  /**
   * Stagger animation for multiple elements
   * Applies the animation class with increasing delays
   */
  const staggerElements = useCallback(
    (elements: HTMLElement[], animationClass: string, options: AnimationOptions = {}) => {
      const { duration = 0.4, delay = 50 } = options;

      elements.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add(animationClass);
          animatingElementsRef.current.add(element);

          // Remove animation class after it completes
          setTimeout(() => {
            element.classList.remove(animationClass);
            animatingElementsRef.current.delete(element);
          }, duration * 1000);
        }, index * delay);
      });
    },
    []
  );

  /**
   * Animate number counter
   */
  const animateNumberCounter = useCallback(
    (
      element: HTMLElement,
      startValue: number,
      endValue: number,
      options: AnimationOptions & { decimals?: number } = {}
    ) => {
      const { duration = 0.5, decimals = 0 } = options;
      const startTime = performance.now();
      const difference = endValue - startValue;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const currentValue = startValue + difference * progress;

        element.textContent = currentValue.toFixed(decimals);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    },
    []
  );

  /**
   * Animate fitness bar fill
   */
  const animateFitnessBar = useCallback(
    (
      element: HTMLElement,
      startValue: number,
      endValue: number,
      options: AnimationOptions = {}
    ) => {
      const { duration = 0.6 } = options;
      const startTime = performance.now();
      const startPercent = startValue * 100;
      const endPercent = endValue * 100;
      const difference = endPercent - startPercent;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        // Use easeInOutQuad for smooth acceleration/deceleration
        const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        const currentPercent = startPercent + difference * easeProgress;

        element.style.width = `${currentPercent}%`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    },
    []
  );

  /**
   * Celebration flash effect
   */
  const celebrationFlash = useCallback((element: HTMLElement, options: AnimationOptions = {}) => {
    element.classList.add('animate-celebration-flash');

    setTimeout(() => {
      element.classList.remove('animate-celebration-flash');
    }, (options.duration || 0.6) * 1000);
  }, []);

  /**
   * Celebration glow effect
   */
  const celebrationGlow = useCallback((element: HTMLElement, options: AnimationOptions = {}) => {
    element.classList.add('animate-celebration-glow');

    setTimeout(() => {
      element.classList.remove('animate-celebration-glow');
    }, (options.duration || 0.8) * 1000);
  }, []);

  /**
   * Particle explosion effect
   */
  const particleExplosion = useCallback(
    (element: HTMLElement, count: number = 8, options: AnimationOptions = {}) => {
      const { duration = 1 } = options;
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.pointerEvents = 'none';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'var(--primary)';
        particle.style.boxShadow = '0 0 10px var(--primary)';

        // Random angle and distance
        const angle = (i / count) * Math.PI * 2;
        const distance = 100 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', tx + 'px');

        document.body.appendChild(particle);

        particle.style.animation = `particleFloat ${duration}s ease-out forwards`;

        setTimeout(() => {
          document.body.removeChild(particle);
        }, duration * 1000);
      }
    },
    []
  );

  /**
   * Smooth scroll to element
   */
  const scrollToElement = useCallback((element: HTMLElement, options: ScrollIntoViewOptions = {}) => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
      ...options,
    });
  }, []);

  /**
   * Pulse effect (repeated)
   */
  const pulseElement = useCallback((element: HTMLElement, count: number = 3, options: AnimationOptions = {}) => {
    const { duration = 0.5, delay = 0 } = options;

    let pulseCount = 0;
    const pulse = () => {
      element.style.animation = `none`;
      // Trigger reflow to restart animation
      void element.offsetWidth;
      element.style.animation = `buttonPress ${duration}s ease-out`;

      pulseCount++;
      if (pulseCount < count) {
        setTimeout(pulse, duration * 1000 + delay);
      }
    };

    pulse();
  }, []);

  return {
    staggerElements,
    animateNumberCounter,
    animateFitnessBar,
    celebrationFlash,
    celebrationGlow,
    particleExplosion,
    scrollToElement,
    pulseElement,
  };
};
