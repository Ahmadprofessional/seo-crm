'use client';

import React, { useEffect, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  duration?: number;
  formatCommas?: boolean;
  className?: string;
}

export function CountUpNumber({
  value,
  duration = 1200,
  formatCommas = true,
  className = '',
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setDisplayValue(value);
        return;
      }
    }

    let startTimestamp: number | null = null;
    const startValue = 0;
    const delta = value - startValue;

    if (delta === 0) {
      setDisplayValue(value);
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Quartic ease out curve: 1 - (1 - t)^4
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + delta * easeOut);
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = formatCommas ? displayValue.toLocaleString('en-GB') : displayValue.toString();

  return <span className={className}>{formatted}</span>;
}
