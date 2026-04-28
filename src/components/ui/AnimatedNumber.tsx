import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type StyleProp,
  type TextStyle,
} from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

export function AnimatedNumber({
  value,
  duration = 450,
  style,
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const previousValue = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: currentValue }) => {
      setDisplayValue(Math.round(currentValue));
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue]);

  useEffect(() => {
    animatedValue.setValue(previousValue.current);

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      previousValue.current = value;
      setDisplayValue(value);
    });
  }, [animatedValue, duration, value]);

  return <Animated.Text style={style}>{displayValue}</Animated.Text>;
}

export default AnimatedNumber;