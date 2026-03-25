import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 250 });
  };

  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}` as keyof typeof styles],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`label_${variant}` as keyof typeof styles],
    styles[`labelSize_${size}` as keyof typeof styles],
  ];

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 17;
  const iconColor =
    variant === 'primary'
      ? '#000000'
      : variant === 'ghost'
      ? colors.accent
      : colors.textPrimary;

  const spinnerColor = variant === 'primary' ? '#000000' : colors.textPrimary;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessible
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading }}
      >
        <Animated.View style={containerStyle}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={spinnerColor}
              style={styles.spinner}
            />
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon as any}
                  size={iconSize}
                  color={iconColor}
                  style={styles.icon}
                />
              )}
              <Text style={textStyle}>{title}</Text>
            </>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // --- Variants ---
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // --- Sizes ---
  size_sm: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  size_md: {
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  size_lg: {
    paddingHorizontal: 28,
    paddingVertical: 17,
    borderRadius: 14,
  },

  disabled: {
    opacity: 0.45,
  },

  icon: {
    marginRight: 7,
  },
  spinner: {
    marginHorizontal: 4,
  },

  // --- Label base ---
  label: {
    fontFamily: typography.fontHeading,
    letterSpacing: 0.3,
  },

  // --- Label variants ---
  label_primary: {
    color: '#000000',
  },
  label_secondary: {
    color: colors.textPrimary,
  },
  label_ghost: {
    color: colors.accent,
    fontFamily: typography.fontBody,
  },

  // --- Label sizes ---
  labelSize_sm: {
    fontSize: typography.sizes.sm,
  },
  labelSize_md: {
    fontSize: typography.sizes.md,
  },
  labelSize_lg: {
    fontSize: typography.sizes.lg,
  },
});
