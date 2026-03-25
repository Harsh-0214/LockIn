import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format, subDays, startOfDay } from 'date-fns';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface StreakGridProps {
  /** Array of completed day strings in YYYY-MM-DD format */
  completedDates: string[];
  /** Fill color for completed cells (default: accent lime) */
  color?: string;
}

const CELL_SIZE = 32;
const GAP = 4;
const COLUMNS = 5;
const ROWS = 6;
const TOTAL_DAYS = COLUMNS * ROWS; // 30

// Five column headers: Mon → Fri week cycle
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakGrid({
  completedDates,
  color = colors.accent,
}: StreakGridProps) {
  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  // Fast O(1) look-up
  const completedSet = useMemo(
    () => new Set(completedDates),
    [completedDates]
  );

  // Build last-30-days array ordered oldest → newest
  const days = useMemo<string[]>(() => {
    const result: string[] = [];
    for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
      result.push(format(subDays(today, i), 'yyyy-MM-dd'));
    }
    return result;
  }, [todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  // Split into rows of COLUMNS cells
  const rows = useMemo<string[][]>(() => {
    const result: string[][] = [];
    for (let r = 0; r < ROWS; r++) {
      result.push(days.slice(r * COLUMNS, r * COLUMNS + COLUMNS));
    }
    return result;
  }, [days]);

  // Derive the column-header letters from the weekday of the first date in the grid
  const headerLetters = useMemo<string[]>(() => {
    const letters: string[] = [];
    for (let c = 0; c < COLUMNS; c++) {
      // Use the date in the first row for each column to get its weekday
      const dateStr = days[c];
      const dayIndex = new Date(dateStr + 'T00:00:00').getDay(); // 0=Sun..6=Sat
      letters.push(DAY_LETTERS[dayIndex] ?? '·');
    }
    return letters;
  }, [days]);

  const getCellStyle = (dateStr: string) => {
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isCompleted = completedSet.has(dateStr);

    if (isToday) {
      return {
        backgroundColor: isCompleted ? color : 'transparent',
        borderWidth: 2,
        borderColor: colors.accent,
      };
    }
    if (isFuture) {
      return {
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
      };
    }
    if (isCompleted) {
      return {
        backgroundColor: color,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    }
    // Past, missed
    return {
      backgroundColor: `${colors.textMuted}33`,
      borderWidth: 0,
      borderColor: 'transparent',
    };
  };

  return (
    <View style={styles.wrapper}>
      {/* Column day-letter headers */}
      <View style={styles.headerRow}>
        {headerLetters.map((letter, i) => (
          <View key={i} style={styles.headerCell}>
            <Text style={styles.headerText}>{letter}</Text>
          </View>
        ))}
      </View>

      {/* Grid rows */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((dateStr, colIdx) => {
            const cellStyle = getCellStyle(dateStr);
            return (
              <View
                key={colIdx}
                style={[styles.cell, cellStyle]}
                accessible
                accessibilityLabel={`${dateStr}${
                  completedSet.has(dateStr) ? ', completed' : ''
                }${dateStr === todayStr ? ', today' : ''}`}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: GAP + 2,
  },
  headerCell: {
    width: CELL_SIZE,
    marginRight: GAP,
    alignItems: 'center',
  },
  headerText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 7,
    marginRight: GAP,
  },
});
