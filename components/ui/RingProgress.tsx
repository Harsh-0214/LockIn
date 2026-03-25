import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

// Wrap SVG Circle with Reanimated so we can drive its props via shared values
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProgressProps {
  /** 0 to 1 */
  progress: number;
  /** Outer diameter in dp (default 120) */
  size?: number;
  /** Ring stroke width in dp (default 12) */
  strokeWidth?: number;
  /** Foreground arc color (default accent lime) */
  color?: string;
  /** Track (background ring) color */
  backgroundColor?: string;
  /** Optional content rendered in the center */
  children?: React.ReactNode;
}

export default function RingProgress({
  progress,
  size = 120,
  strokeWidth = 12,
  color = colors.accent,
  backgroundColor = colors.border,
  children,
}: RingProgressProps) {
  // Clamp to [0, 1] so bad data never breaks the SVG maths
  const clampedProgress = Math.min(1, Math.max(0, progress));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Start at 0, animate to the real progress on mount (and on prop change)
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedProgress]);

  // Drive strokeDashoffset from 0→circumference (empty) to 0 (full)
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* SVG layer */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/*
          Foreground arc.
          strokeDasharray sets the dash equal to the full circumference so
          the single dash covers the whole circle; strokeDashoffset then
          "rewinds" it. The SVG is rotated -90° so progress begins at 12 o'clock.
        */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center content slot */}
      {children != null && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
