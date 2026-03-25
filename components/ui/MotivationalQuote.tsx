import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface MotivationalQuoteProps {
  quote: string;
  author: string;
}

export default function MotivationalQuote({
  quote,
  author,
}: MotivationalQuoteProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 500,
        easing: Easing.out(Easing.quad),
      }}
      style={styles.container}
    >
      {/* 4px lime left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.textBlock}>
        <Text style={styles.quoteText}>"{quote}"</Text>
        <Text style={styles.authorText}>— {author}</Text>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.accent,
    // Rounded corners only on the left side to match the card radius
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  textBlock: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  quoteText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  authorText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
