import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  // Opacity pulses between a dim base and a slightly brighter highlight,
  // creating a subtle shimmer effect that matches the dark app theme.
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.35, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // repeat forever
      false // do NOT reverse (we handle reversal via the sequence above)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        animatedStyle,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
      accessible
      accessibilityLabel="Loading"
    />
  );
}

// ─── Compound helpers ────────────────────────────────────────────────────────

/** Pre-composed skeleton for a single line of text */
export function SkeletonText({
  width = '80%',
  style,
}: {
  width?: number | string;
  style?: ViewStyle;
}) {
  return <SkeletonLoader width={width} height={14} borderRadius={6} style={style} />;
}

/** Pre-composed skeleton for a square/circle avatar or icon placeholder */
export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

/** Pre-composed skeleton for a full card block */
export function SkeletonCard({
  height = 100,
  style,
}: {
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonLoader
      width="100%"
      height={height}
      borderRadius={16}
      style={style}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  skeleton: {
    // A mid-tone between surface and surfaceElevated so it reads as a
    // placeholder against the dark '#161824' / '#1E2030' backgrounds.
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
});
