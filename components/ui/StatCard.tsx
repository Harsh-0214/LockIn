import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface StatCardProps {
  /** Ionicons icon name */
  icon: string;
  /** Circle background tint + icon color (default: accent lime) */
  iconColor?: string;
  /** Big number / value displayed */
  value: string | number;
  /** Descriptive label shown below the value */
  label: string;
  /**
   * Optional trend direction.
   * In a weight context: 'up' = bad (coral/red), 'down' = good (green).
   */
  trend?: 'up' | 'down' | 'stable';
  onPress?: () => void;
}

// ─── Trend indicator ────────────────────────────────────────────────────────

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'stable') {
    return (
      <View style={[styles.trendBadge, { backgroundColor: `${colors.textMuted}22` }]}>
        <Text style={[styles.trendText, { color: colors.textMuted }]}>→</Text>
      </View>
    );
  }

  // Weight context: up = heavier (bad / coral), down = lighter (good / green)
  const isUp = trend === 'up';
  const trendColor = isUp ? colors.coral : colors.success;
  const arrow = isUp ? '▲' : '▼';

  return (
    <View style={[styles.trendBadge, { backgroundColor: `${trendColor}22` }]}>
      <Text style={[styles.trendText, { color: trendColor }]}>{arrow}</Text>
    </View>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function StatCard({
  icon,
  iconColor = colors.accent,
  value,
  label,
  trend,
  onPress,
}: StatCardProps) {
  const inner = (
    <View style={styles.card}>
      {/* Top row: icon circle + optional trend badge */}
      <View style={styles.topRow}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${iconColor}22` }]}
        >
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        {trend != null && <TrendIndicator trend={trend} />}
      </View>

      {/* Big value */}
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      {/* Label */}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  trendText: {
    fontSize: 11,
    fontFamily: typography.fontBody,
    fontWeight: '700',
  },
  value: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    lineHeight: 30,
  },
  label: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
