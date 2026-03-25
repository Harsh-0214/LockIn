import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
  variant?: 'filled' | 'outline';
}

export default function Badge({
  label,
  color = colors.accent,
  size = 'md',
  variant = 'filled',
}: BadgeProps) {
  const isFilled = variant === 'filled';

  // Filled: semi-transparent tinted background.
  // Outline: transparent bg with a colored border.
  const bgColor = isFilled ? `${color}26` : 'transparent';

  const containerStyle = [
    styles.base,
    size === 'sm' ? styles.sm : styles.md,
    {
      backgroundColor: bgColor,
      borderColor: color,
      borderWidth: isFilled ? 0 : 1,
    },
  ];

  const labelStyle = [
    styles.label,
    size === 'sm' ? styles.labelSm : styles.labelMd,
    { color },
  ];

  return (
    <View style={containerStyle}>
      <Text style={labelStyle} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    overflow: 'hidden',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontFamily: typography.fontBody,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: typography.sizes.xs,
  },
  labelMd: {
    fontSize: typography.sizes.sm,
  },
});
