import React, { useState, useCallback, useRef } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { format } from 'date-fns';

import { colors, habitColors } from '@/constants/colors';
import { typography } from '@/constants/typography';

import { useHabitsStore } from '@/store/useHabitsStore';
import type { Habit } from '@/store/useHabitsStore';

import StreakGrid from '@/components/ui/StreakGrid';

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  'flame', 'barbell', 'book', 'water-outline', 'moon', 'nutrition',
  'bicycle', 'heart', 'star', 'cafe', 'musical-notes', 'walk',
  'man', 'football', 'basketball', 'home', 'school', 'brush',
  'cut', 'paw', 'leaf', 'flower', 'sunny', 'cloud',
];

const DAY_CHIPS = [
  { label: 'M', value: 'mon' },
  { label: 'T', value: 'tue' },
  { label: 'W', value: 'wed' },
  { label: 'T', value: 'thu' },
  { label: 'F', value: 'fri' },
  { label: 'S', value: 'sat' },
  { label: 'S', value: 'sun' },
];

function getMilestoneMessage(streak: number): string | null {
  if (streak >= 30) return '🏆 30 day milestone! You\'re unstoppable!';
  if (streak >= 21) return '🔥 21 days — habit officially formed!';
  if (streak >= 7) return '⚡ 7 day streak! Keep the momentum!';
  if (streak >= 3) return '✨ 3 days in — great start!';
  return null;
}

// ─── Add Habit Modal ──────────────────────────────────────────────────────────

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
}

function AddHabitModal({ visible, onClose, onSave }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('flame');
  const [color, setColor] = useState(habitColors[0]);
  const [isDaily, setIsDaily] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [reminderTime, setReminderTime] = useState('');
  const [graceDay, setGraceDay] = useState(false);

  const reset = () => {
    setName('');
    setIcon('flame');
    setColor(habitColors[0]);
    setIsDaily(true);
    setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    setReminderTime('');
    setGraceDay(false);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a habit name.');
      return;
    }
    const frequency = isDaily ? 'daily' : selectedDays.join(',');
    onSave({
      name: name.trim(),
      icon,
      color,
      frequency,
      reminderTime: reminderTime.trim() || undefined,
      graceDay,
      archived: false,
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={addModalStyles.overlay}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={addModalStyles.sheet}>
            <View style={addModalStyles.titleRow}>
              <Text style={addModalStyles.title}>New Habit</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <TextInput
              style={addModalStyles.input}
              placeholder="Habit name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            {/* Icon picker */}
            <Text style={addModalStyles.fieldLabel}>Icon</Text>
            <View style={addModalStyles.iconGrid}>
              {ICON_OPTIONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    addModalStyles.iconBtn,
                    icon === ic && { backgroundColor: `${color}33`, borderColor: color },
                  ]}
                  onPress={() => { setIcon(ic); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Ionicons name={ic as any} size={22} color={icon === ic ? color : colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Color picker */}
            <Text style={addModalStyles.fieldLabel}>Color</Text>
            <View style={addModalStyles.colorRow}>
              {habitColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    addModalStyles.colorCircle,
                    { backgroundColor: c },
                    color === c && addModalStyles.colorCircleActive,
                  ]}
                  onPress={() => { setColor(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                />
              ))}
            </View>

            {/* Frequency */}
            <Text style={addModalStyles.fieldLabel}>Frequency</Text>
            <View style={addModalStyles.freqRow}>
              <TouchableOpacity
                style={[addModalStyles.freqBtn, isDaily && addModalStyles.freqBtnActive]}
                onPress={() => setIsDaily(true)}
              >
                <Text style={[addModalStyles.freqBtnText, isDaily && addModalStyles.freqBtnTextActive]}>
                  Every day
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[addModalStyles.freqBtn, !isDaily && addModalStyles.freqBtnActive]}
                onPress={() => setIsDaily(false)}
              >
                <Text style={[addModalStyles.freqBtnText, !isDaily && addModalStyles.freqBtnTextActive]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {!isDaily && (
              <View style={addModalStyles.dayChipsRow}>
                {DAY_CHIPS.map((d) => {
                  const isSelected = selectedDays.includes(d.value);
                  return (
                    <TouchableOpacity
                      key={d.value}
                      style={[
                        addModalStyles.dayChip,
                        isSelected && { backgroundColor: `${color}33`, borderColor: color },
                      ]}
                      onPress={() => toggleDay(d.value)}
                    >
                      <Text style={[addModalStyles.dayChipText, isSelected && { color }]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Reminder time */}
            <Text style={addModalStyles.fieldLabel}>Reminder (optional)</Text>
            <TextInput
              style={addModalStyles.input}
              placeholder="HH:MM (e.g. 08:00)"
              placeholderTextColor={colors.textMuted}
              value={reminderTime}
              onChangeText={setReminderTime}
              keyboardType="numbers-and-punctuation"
            />

            {/* Grace day toggle */}
            <View style={addModalStyles.graceRow}>
              <View>
                <Text style={addModalStyles.graceLabel}>Grace Day</Text>
                <Text style={addModalStyles.graceSubLabel}>Skip one day without breaking streak</Text>
              </View>
              <Switch
                value={graceDay}
                onValueChange={setGraceDay}
                trackColor={{ false: colors.border, true: `${color}88` }}
                thumbColor={graceDay ? color : colors.textMuted}
              />
            </View>

            <TouchableOpacity style={addModalStyles.saveBtn} onPress={handleSave}>
              <Text style={addModalStyles.saveBtnText}>Save Habit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const addModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  freqBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  freqBtnActive: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
  },
  freqBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  freqBtnTextActive: {
    color: colors.accent,
  },
  dayChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  graceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  graceLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  graceSubLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.md,
    color: '#000',
  },
});

// ─── Habit Detail Modal ──────────────────────────────────────────────────────

interface HabitDetailModalProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

function HabitDetailModal({ visible, habit, onClose, onEdit, onArchive, onDelete }: HabitDetailModalProps) {
  const { getCurrentStreak, getLongestStreak, getCompletionRate, getHabitLogsForMonth } = useHabitsStore();

  if (!habit) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const currentStreak = getCurrentStreak(habit.id);
  const longestStreak = getLongestStreak(habit.id);
  const completionRate = getCompletionRate(habit.id, 30);
  const monthLogs = getHabitLogsForMonth(habit.id, year, month);
  const milestone = getMilestoneMessage(currentStreak);

  const handleArchive = () => {
    Alert.alert('Archive Habit', 'This habit will be hidden from your daily list. You can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: () => {
          onArchive(habit.id);
          onClose();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Habit', 'This will permanently delete the habit and all its logs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete(habit.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={detailStyles.safeArea} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={detailStyles.scrollContent}>
          {/* Close button */}
          <View style={detailStyles.topBar}>
            <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={detailStyles.header}>
            <View style={[detailStyles.iconCircle, { backgroundColor: `${habit.color}22` }]}>
              <Ionicons name={habit.icon as any} size={32} color={habit.color} />
            </View>
            <Text style={detailStyles.habitName}>{habit.name}</Text>
            <Text style={detailStyles.frequencyText}>
              {habit.frequency === 'daily' ? 'Every day' : habit.frequency}
            </Text>
          </View>

          {/* Milestone message */}
          {milestone && (
            <View style={[detailStyles.milestoneBanner, { borderColor: `${habit.color}44` }]}>
              <Text style={[detailStyles.milestoneText, { color: habit.color }]}>{milestone}</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={detailStyles.statsRow}>
            <View style={detailStyles.statBox}>
              <Text style={[detailStyles.statValue, { color: colors.coral }]}>{currentStreak}</Text>
              <Text style={detailStyles.statLabel}>Current{'\n'}Streak</Text>
            </View>
            <View style={detailStyles.statDivider} />
            <View style={detailStyles.statBox}>
              <Text style={[detailStyles.statValue, { color: colors.accent }]}>{longestStreak}</Text>
              <Text style={detailStyles.statLabel}>Longest{'\n'}Streak</Text>
            </View>
            <View style={detailStyles.statDivider} />
            <View style={detailStyles.statBox}>
              <Text style={[detailStyles.statValue, { color: colors.success }]}>
                {Math.round(completionRate * 100)}%
              </Text>
              <Text style={detailStyles.statLabel}>30-day{'\n'}Rate</Text>
            </View>
          </View>

          {/* Streak grid */}
          <Text style={detailStyles.gridTitle}>Last 30 Days</Text>
          <View style={detailStyles.gridContainer}>
            <StreakGrid completedDates={monthLogs} color={habit.color} />
          </View>

          {/* Action buttons */}
          <View style={detailStyles.actionButtons}>
            <TouchableOpacity
              style={detailStyles.archiveBtn}
              onPress={handleArchive}
            >
              <Ionicons name="archive-outline" size={17} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={[detailStyles.actionBtnText, { color: colors.warning }]}>Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={detailStyles.deleteBtn}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={17} color={colors.coral} style={{ marginRight: 8 }} />
              <Text style={[detailStyles.actionBtnText, { color: colors.coral }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topBar: {
    alignItems: 'flex-end',
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitName: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
  },
  frequencyText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  milestoneBanner: {
    backgroundColor: `${colors.accent}11`,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  milestoneText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['2xl'],
  },
  statLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  gridTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  actionButtons: {
    gap: 12,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.warning}18`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.warning}44`,
    paddingVertical: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.coral}18`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.coral}44`,
    paddingVertical: 14,
  },
  actionBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
});

// ─── Habit Row ────────────────────────────────────────────────────────────────

interface HabitRowProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggle: () => void;
  onPress: () => void;
}

function HabitRow({ habit, isCompleted, streak, onToggle, onPress }: HabitRowProps) {
  return (
    <Pressable onPress={onPress} style={rowStyles.row}>
      {/* Icon */}
      <View style={[rowStyles.iconCircle, { backgroundColor: `${habit.color}22` }]}>
        <Ionicons name={habit.icon as any} size={20} color={habit.color} />
      </View>

      {/* Name + streak chip */}
      <View style={rowStyles.content}>
        <Text style={[rowStyles.name, isCompleted && rowStyles.nameCompleted]}>{habit.name}</Text>
        {streak > 0 && (
          <View style={[rowStyles.streakChip, { backgroundColor: `${colors.coral}22` }]}>
            <Text style={rowStyles.streakChipText}>{streak} day streak 🔥</Text>
          </View>
        )}
      </View>

      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={10}
        accessibilityLabel={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        <MotiView
          animate={{ scale: isCompleted ? [1.2, 1] : 1 }}
          transition={{ type: 'spring', damping: 14 }}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={28}
            color={isCompleted ? habit.color : colors.textMuted}
          />
        </MotiView>
      </TouchableOpacity>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  nameCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  streakChip: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakChipText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.coral,
    fontWeight: '700',
  },
});

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FocusScreen() {
  const {
    habits,
    getTodayHabits,
    toggleHabitLog,
    isHabitCompleted,
    getCurrentStreak,
    getLongestStreak,
    areAllTodayHabitsDone,
    addHabit,
    archiveHabit,
    deleteHabit,
  } = useHabitsStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayHabits = getTodayHabits();
  const archivedHabits = habits.filter((h) => h.archived);
  const allDone = areAllTodayHabitsDone();

  const handleToggle = useCallback(
    (habitId: string) => {
      toggleHabitLog(habitId, today);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [toggleHabitLog, today]
  );

  const handleHabitPress = useCallback((habit: Habit) => {
    setSelectedHabit(habit);
    setDetailModalVisible(true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ── */}
        <Text style={styles.screenTitle}>Focus</Text>

        {/* ── All done banner ── */}
        {allDone && todayHabits.length > 0 && (
          <MotiView
            from={{ translateY: -40, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 16, stiffness: 200 }}
            style={styles.allDoneBanner}
          >
            <Ionicons name="trophy" size={20} color={colors.warning} style={{ marginRight: 8 }} />
            <Text style={styles.allDoneText}>All done! 🏆 You crushed today!</Text>
          </MotiView>
        )}

        {/* ── Today's Habits ── */}
        <Text style={styles.sectionTitle}>Today's Habits</Text>

        {todayHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first habit and start building momentum.</Text>
          </View>
        ) : (
          todayHabits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              isCompleted={isHabitCompleted(habit.id, today)}
              streak={getCurrentStreak(habit.id)}
              onToggle={() => handleToggle(habit.id)}
              onPress={() => handleHabitPress(habit)}
            />
          ))
        )}

        {/* ── Archived Habits ── */}
        {archivedHabits.length > 0 && (
          <View style={styles.archivedSection}>
            <TouchableOpacity
              style={styles.archivedToggle}
              onPress={() => {
                setArchivedExpanded((prev) => !prev);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.archivedToggleText}>Archived Habits ({archivedHabits.length})</Text>
              <Ionicons
                name={archivedExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {archivedExpanded &&
              archivedHabits.map((habit) => (
                <Pressable
                  key={habit.id}
                  style={styles.archivedRow}
                  onPress={() => handleHabitPress(habit)}
                >
                  <View style={[styles.archivedIconCircle, { backgroundColor: `${habit.color}18` }]}>
                    <Ionicons name={habit.icon as any} size={18} color={`${habit.color}88`} />
                  </View>
                  <Text style={styles.archivedName}>{habit.name}</Text>
                  <Ionicons name="archive-outline" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setAddModalVisible(true);
        }}
        activeOpacity={0.85}
        accessibilityLabel="Add habit"
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      {/* ── Add Habit Modal ── */}
      <AddHabitModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={(habitData) => {
          addHabit(habitData);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      {/* ── Habit Detail Modal ── */}
      <HabitDetailModal
        visible={detailModalVisible}
        habit={selectedHabit}
        onClose={() => { setDetailModalVisible(false); setSelectedHabit(null); }}
        onEdit={(h) => { setDetailModalVisible(false); }}
        onArchive={(id) => { archiveHabit(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
        onDelete={(id) => { deleteHabit(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  screenTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['3xl'],
    color: colors.textPrimary,
    marginBottom: 22,
  },
  sectionTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}18`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.warning}44`,
    padding: 14,
    marginBottom: 20,
  },
  allDoneText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.warning,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  archivedSection: {
    marginTop: 28,
  },
  archivedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  archivedToggleText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
    marginBottom: 8,
    opacity: 0.7,
  },
  archivedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedName: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
});
