// src/components/gamification/AnimatedNumber.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  formatter?: (value: number) => string;
}

const easeOutCubic = (value: number): number => {
  return 1 - Math.pow(1 - value, 3);
};

export const AnimatedNumber = ({
  value,
  duration = 700,
  prefix = '',
  suffix = '',
  style,
  formatter,
}: AnimatedNumberProps) => {
  const [displayedValue, setDisplayedValue] = useState(value);

  const previousValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (duration <= 0) {
      setDisplayedValue(value);
      previousValueRef.current = value;
      return;
    }

    const from = previousValueRef.current;
    const to = value;
    let startTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (startTimestamp === null) {
        startTimestamp = timestamp;
      }

      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);

      const nextValue = Math.round(from + (to - from) * easedProgress);

      setDisplayedValue(nextValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      previousValueRef.current = to;
      animationFrameRef.current = null;
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [duration, value]);

  const formattedValue = formatter
    ? formatter(displayedValue)
    : String(displayedValue);

  return (
    <Text style={style}>
      {prefix}
      {formattedValue}
      {suffix}
    </Text>
  );
};