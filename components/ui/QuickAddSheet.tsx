import React, { useCallback, useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: () => void;
  onLogWeight: () => void;
  onAddNote: () => void;
  onAddHabit: () => void;
}

interface TileConfig {
  label: string;
  icon: string;
  tileColor: string;
  onPress: () => void;
}

const SNAP_POINTS = ['45%'];

export default function QuickAddSheet({
  isOpen,
  onClose,
  onAddTask,
  onLogWeight,
  onAddNote,
  onAddHabit,
}: QuickAddSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);

  // Sync open/close state driven by parent
  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  const tiles: TileConfig[] = [
    {
      label: 'Add Task',
      icon: 'checkmark-circle',
      tileColor: colors.coral,
      onPress: onAddTask,
    },
    {
      label: 'Log Weight',
      icon: 'scale',
      tileColor: colors.blue,
      onPress: onLogWeight,
    },
    {
      label: 'Add Note',
      icon: 'document-text',
      tileColor: colors.purple,
      onPress: onAddNote,
    },
    {
      label: 'Add Habit',
      icon: 'flame',
      tileColor: colors.accent,
      onPress: onAddHabit,
    },
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handleContainer}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Sheet title */}
        <Text style={styles.title}>Quick Add</Text>

        {/* 2×2 tile grid */}
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <Pressable
              key={tile.label}
              onPress={() => {
                tile.onPress();
                onClose();
              }}
              style={({ pressed }) => [
                styles.tile,
                pressed && styles.tilePressed,
              ]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={tile.label}
            >
              {/* Tinted icon circle */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${tile.tileColor}22` },
                ]}
              >
                <Ionicons
                  name={tile.icon as any}
                  size={28}
                  color={tile.tileColor}
                />
              </View>

              <Text style={styles.tileLabel}>{tile.label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handleContainer: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleIndicator: {
    backgroundColor: colors.border,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  title: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    columnGap: 14,
  },
  tile: {
    width: '47%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
    gap: 10,
  },
  tilePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
