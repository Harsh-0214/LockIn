import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { format } from 'date-fns';

import { colors, categoryColors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { quotes } from '@/constants/quotes';
import { getDayOfYear, formatDate, formatTime } from '@/utils/dateHelpers';

import { useUserStore } from '@/store/useUserStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useNotesStore } from '@/store/useNotesStore';

import Card from '@/components/ui/Card';
import QuickAddSheet from '@/components/ui/QuickAddSheet';
import MotivationalQuote from '@/components/ui/MotivationalQuote';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuickModal = 'task' | 'weight' | 'note' | 'habit' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getTodayQuote() {
  const dayOfYear = getDayOfYear(new Date());
  return quotes[dayOfYear % quotes.length];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  // Store hooks
  const { name, dailyCalorieGoal } = useUserStore();
  const { getTodayCalories, getWeightTrend, weightEntries, addWeightEntry } = useBodyStore();
  const unit = useUserStore((s) => s.unit);
  const { getEventsForDate } = useCalendarStore();
  const { getTodayHabits, getCurrentStreak, getLongestStreak, areAllTodayHabitsDone, addHabit } = useHabitsStore();
  const { addNote } = useNotesStore();
  const { addEvent } = useCalendarStore();

  // Local state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickModal, setQuickModal] = useState<QuickModal>(null);
  const [allDone, setAllDone] = useState(false);
  const confettiRef = useRef<any>(null);

  // Quick modal input state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [habitName, setHabitName] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = getEventsForDate(todayStr).slice(0, 3);
  const todayCalories = getTodayCalories();
  const caloriesRemaining = dailyCalorieGoal - todayCalories;
  const trend = getWeightTrend();
  const latestWeight = weightEntries.length > 0
    ? weightEntries.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0]
    : null;

  const todayHabits = getTodayHabits();
  const firstHabit = todayHabits[0];
  const currentStreak = firstHabit ? getCurrentStreak(firstHabit.id) : 0;
  const longestStreak = firstHabit ? getLongestStreak(firstHabit.id) : 0;

  const quote = getTodayQuote();

  // Check for all habits done
  useEffect(() => {
    const done = areAllTodayHabitsDone();
    if (done && !allDone) {
      setAllDone(true);
      setTimeout(() => {
        confettiRef.current?.start();
      }, 300);
    } else if (!done) {
      setAllDone(false);
    }
  }, [areAllTodayHabitsDone]);

  const handleFABPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetOpen(true);
  }, []);

  const openModal = useCallback((type: QuickModal) => {
    setSheetOpen(false);
    setTimeout(() => setQuickModal(type), 200);
  }, []);

  const closeModal = useCallback(() => {
    setQuickModal(null);
    setTaskTitle('');
    setTaskTime('');
    setWeightInput('');
    setNoteTitle('');
    setNoteContent('');
    setHabitName('');
  }, []);

  // Save handlers
  const handleSaveTask = useCallback(() => {
    if (!taskTitle.trim()) return;
    const now = new Date();
    let startTime = now;
    if (taskTime) {
      const [h, m] = taskTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        startTime = new Date();
        startTime.setHours(h, m, 0, 0);
      }
    }
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    addEvent({
      title: taskTitle.trim(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      category: 'Personal',
      repeat: 'none',
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  }, [taskTitle, taskTime, addEvent, closeModal]);

  const handleSaveWeight = useCallback(() => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;
    addWeightEntry(w, unit);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  }, [weightInput, unit, addWeightEntry, closeModal]);

  const handleSaveNote = useCallback(() => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    addNote({ title: noteTitle.trim(), content: noteContent.trim(), pinned: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  }, [noteTitle, noteContent, addNote, closeModal]);

  const handleSaveHabit = useCallback(() => {
    if (!habitName.trim()) return;
    addHabit({
      name: habitName.trim(),
      icon: 'flame',
      color: colors.accent,
      frequency: 'daily',
      graceDay: false,
      archived: false,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  }, [habitName, addHabit, closeModal]);

  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';
  const trendColor = trend === 'up' ? colors.coral : trend === 'down' ? colors.success : colors.textMuted;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.greeting}>{getGreeting()}{name ? `, ${name}` : ''} 👋</Text>
            <Text style={styles.dateText}>{formatDate(new Date())}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            style={styles.settingsBtn}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </MotiView>

        {/* ── Motivational Quote ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 80 }}
          style={styles.section}
        >
          <MotivationalQuote quote={quote.quote} author={quote.author} />
        </MotiView>

        {/* ── All habits done banner ── */}
        {allDone && (
          <MotiView
            from={{ translateY: -60, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            style={styles.allDoneBanner}
          >
            <Text style={styles.allDoneText}>All done! You crushed it today 🏆</Text>
          </MotiView>
        )}

        {/* ── Today's Events ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 140 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Card style={styles.card}>
            {todayEvents.length === 0 ? (
              <View style={styles.emptyEventsRow}>
                <Text style={styles.emptyEventsText}>All clear today 🎉</Text>
              </View>
            ) : (
              todayEvents.map((event) => {
                const catColor = categoryColors[event.category] ?? colors.textMuted;
                return (
                  <View key={event.id} style={styles.eventRow}>
                    <View style={[styles.eventDot, { backgroundColor: catColor }]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                      <Text style={styles.eventTime}>
                        {formatTime(new Date(event.startTime))} · {event.category}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </MotiView>

        {/* ── Body Widget ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 200 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Body</Text>
          <Card
            style={styles.card}
            onPress={() => router.push('/(tabs)/body' as any)}
          >
            <View style={styles.bodyWidgetRow}>
              <View style={styles.bodyWidgetItem}>
                <Text style={styles.bodyWidgetValue}>
                  {caloriesRemaining > 0 ? caloriesRemaining : 0}
                </Text>
                <Text style={styles.bodyWidgetLabel}>kcal left</Text>
              </View>
              <View style={styles.bodyWidgetDivider} />
              <View style={styles.bodyWidgetItem}>
                {latestWeight ? (
                  <>
                    <View style={styles.weightRow}>
                      <Text style={styles.bodyWidgetValue}>
                        {latestWeight.weight}
                      </Text>
                      <Ionicons
                        name={trendIcon as any}
                        size={16}
                        color={trendColor}
                        style={{ marginLeft: 4, marginTop: 2 }}
                      />
                    </View>
                    <Text style={styles.bodyWidgetLabel}>{latestWeight.unit}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.bodyWidgetValue}>—</Text>
                    <Text style={styles.bodyWidgetLabel}>no weight</Text>
                  </>
                )}
              </View>
            </View>
          </Card>
        </MotiView>

        {/* ── Streak Widget ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 260 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Streaks</Text>
          <Card
            style={styles.card}
            onPress={() => router.push('/(tabs)/focus' as any)}
          >
            {firstHabit ? (
              <View style={styles.streakContent}>
                <View style={[styles.habitIconCircle, { backgroundColor: `${firstHabit.color}22` }]}>
                  <Ionicons name={firstHabit.icon as any} size={22} color={firstHabit.color} />
                </View>
                <View style={styles.streakTextBlock}>
                  <Text style={styles.streakHabitName} numberOfLines={1}>{firstHabit.name}</Text>
                  <Text style={[styles.streakValue, { color: colors.coral }]}>
                    {currentStreak} day streak 🔥
                  </Text>
                  <Text style={styles.streakSub}>Longest: {longestStreak} days</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            ) : (
              <View style={styles.emptyEventsRow}>
                <Text style={styles.emptyEventsText}>No habits yet — add one!</Text>
              </View>
            )}
          </Card>
        </MotiView>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFABPress}
        activeOpacity={0.85}
        accessibilityLabel="Quick add"
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      {/* ── QuickAddSheet ── */}
      <QuickAddSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAddTask={() => openModal('task')}
        onLogWeight={() => openModal('weight')}
        onAddNote={() => openModal('note')}
        onAddHabit={() => openModal('habit')}
      />

      {/* ── Add Task Modal ── */}
      <Modal visible={quickModal === 'task'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Task title"
              placeholderTextColor={colors.textMuted}
              value={taskTitle}
              onChangeText={setTaskTitle}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Time (HH:MM, optional)"
              placeholderTextColor={colors.textMuted}
              value={taskTime}
              onChangeText={setTaskTime}
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveTask}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Log Weight Modal ── */}
      <Modal visible={quickModal === 'weight'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`Weight (${unit})`}
              placeholderTextColor={colors.textMuted}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveWeight}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Note Modal ── */}
      <Modal visible={quickModal === 'note'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor={colors.textMuted}
              value={noteTitle}
              onChangeText={setNoteTitle}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Content"
              placeholderTextColor={colors.textMuted}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNote}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Habit Modal ── */}
      <Modal visible={quickModal === 'habit'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Habit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Habit name"
              placeholderTextColor={colors.textMuted}
              value={habitName}
              onChangeText={setHabitName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveHabit}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confetti ── */}
      {allDone && (
        <ConfettiCannon
          ref={confettiRef}
          count={120}
          origin={{ x: -20, y: 0 }}
          autoStart={false}
          fadeOut
          colors={[colors.accent, colors.coral, colors.blue, colors.purple, colors.success]}
        />
      )}
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
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
  },
  dateText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    padding: 16,
  },
  // Events
  emptyEventsRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyEventsText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  eventTime: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Body widget
  bodyWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bodyWidgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  bodyWidgetDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  bodyWidgetValue: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
  },
  bodyWidgetLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Streak
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTextBlock: {
    flex: 1,
    gap: 2,
  },
  streakHabitName: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  streakValue: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  streakSub: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  // All done banner
  allDoneBanner: {
    backgroundColor: `${colors.success}22`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.success}44`,
    padding: 14,
    marginBottom: 18,
    alignItems: 'center',
  },
  allDoneText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.success,
    fontWeight: '700',
  },
  // FAB
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
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.md,
    color: '#000',
  },
});
