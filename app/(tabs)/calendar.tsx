import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Linking,
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
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns';

import { colors, categoryColors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { formatTime } from '@/utils/dateHelpers';

import { useCalendarStore } from '@/store/useCalendarStore';
import type { CalendarEvent } from '@/store/useCalendarStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'Work' | 'Health' | 'Personal' | 'Other';
type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly';
type AlertOption = { label: string; minutes: number | null };

const CATEGORIES: Category[] = ['Work', 'Health', 'Personal', 'Other'];

const REPEAT_OPTIONS: { label: string; value: RepeatOption }[] = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const ALERT_OPTIONS: AlertOption[] = [
  { label: 'None', minutes: null },
  { label: '15 min', minutes: 15 },
  { label: '1 hr', minutes: 60 },
  { label: '1 day', minutes: 1440 },
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Notification helpers ─────────────────────────────────────────────────────

async function scheduleEventNotification(
  title: string,
  startTimeISO: string,
  alertOffsetMinutes: number
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const trigger = new Date(new Date(startTimeISO).getTime() - alertOffsetMinutes * 60 * 1000);
    if (trigger.getTime() <= Date.now()) return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Event',
        body: title,
        sound: true,
      },
      trigger: { date: trigger },
    });
    return id;
  } catch {
    return null;
  }
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────

interface AddEventModalProps {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
}

function AddEventModal({ visible, selectedDate, onClose, onSave }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<Category>('Personal');
  const [repeat, setRepeat] = useState<RepeatOption>('none');
  const [alertOption, setAlertOption] = useState<AlertOption>(ALERT_OPTIONS[0]);
  const [notes, setNotes] = useState('');

  const reset = () => {
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setCategory('Personal');
    setRepeat('none');
    setAlertOption(ALERT_OPTIONS[0]);
    setNotes('');
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }

    const parseTime = (timeStr: string, dateStr: string): Date => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(dateStr);
      d.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0);
      return d;
    };

    const startDate = parseTime(startTime, selectedDate);
    const endDate = parseTime(endTime, selectedDate);

    if (endDate <= startDate) {
      endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
    }

    onSave({
      title: title.trim(),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      category,
      repeat,
      alertOffset: alertOption.minutes ?? undefined,
      notes: notes.trim() || undefined,
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
      <View style={modalStyles.overlay}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={modalStyles.sheet}>
            <View style={modalStyles.titleRow}>
              <Text style={modalStyles.modalTitle}>New Event</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <TextInput
              style={modalStyles.input}
              placeholder="Event title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            {/* Date display */}
            <View style={modalStyles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={modalStyles.dateText}>
                {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>

            {/* Time row */}
            <View style={modalStyles.timeRow}>
              <View style={modalStyles.timeField}>
                <Text style={modalStyles.fieldLabel}>Start</Text>
                <TextInput
                  style={modalStyles.timeInput}
                  placeholder="09:00"
                  placeholderTextColor={colors.textMuted}
                  value={startTime}
                  onChangeText={setStartTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.textMuted} style={{ marginTop: 22 }} />
              <View style={modalStyles.timeField}>
                <Text style={modalStyles.fieldLabel}>End</Text>
                <TextInput
                  style={modalStyles.timeInput}
                  placeholder="10:00"
                  placeholderTextColor={colors.textMuted}
                  value={endTime}
                  onChangeText={setEndTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Category picker */}
            <Text style={modalStyles.fieldLabel}>Category</Text>
            <View style={modalStyles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const catColor = categoryColors[cat];
                const isActive = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      modalStyles.catBtn,
                      isActive && { backgroundColor: `${catColor}33`, borderColor: catColor },
                    ]}
                    onPress={() => { setCategory(cat); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[modalStyles.catBtnText, isActive && { color: catColor }]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Repeat picker */}
            <Text style={modalStyles.fieldLabel}>Repeat</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {REPEAT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[modalStyles.repeatBtn, repeat === opt.value && modalStyles.repeatBtnActive]}
                  onPress={() => setRepeat(opt.value)}
                >
                  <Text style={[modalStyles.repeatBtnText, repeat === opt.value && modalStyles.repeatBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Alert picker */}
            <Text style={modalStyles.fieldLabel}>Alert</Text>
            <View style={modalStyles.alertRow}>
              {ALERT_OPTIONS.map((opt) => {
                const isActive = alertOption.label === opt.label;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[modalStyles.alertBtn, isActive && modalStyles.alertBtnActive]}
                    onPress={() => setAlertOption(opt)}
                  >
                    <Text style={[modalStyles.alertBtnText, isActive && modalStyles.alertBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <TextInput
              style={[modalStyles.input, { height: 72, marginTop: 14 }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />

            {/* Save button */}
            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}>
              <Text style={modalStyles.saveBtnText}>Save Event</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
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
  modalTitle: {
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
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  timeField: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  catBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  repeatBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  repeatBtnActive: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
  },
  repeatBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  repeatBtnTextActive: {
    color: colors.accent,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  alertBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alertBtnActive: {
    backgroundColor: `${colors.warning}22`,
    borderColor: colors.warning,
  },
  alertBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  alertBtnTextActive: {
    color: colors.warning,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.md,
    color: '#000',
  },
});

// ─── Calendar Grid ────────────────────────────────────────────────────────────

interface CalendarGridProps {
  viewMonth: Date;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
}

function CalendarGrid({ viewMonth, selectedDate, onSelectDate, getEventsForDate }: CalendarGridProps) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const daysInMonth = getDaysInMonth(viewMonth);
  const firstDayOfMonth = getDay(startOfMonth(viewMonth)); // 0=Sun
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDayOfMonth + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const formatDayStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <View style={gridStyles.container}>
      {/* Day headers */}
      <View style={gridStyles.headerRow}>
        {DAY_HEADERS.map((d, i) => (
          <View key={i} style={gridStyles.headerCell}>
            <Text style={gridStyles.headerText}>{d}</Text>
          </View>
        ))}
      </View>
      {/* Day rows */}
      {rows.map((row, ri) => (
        <View key={ri} style={gridStyles.row}>
          {row.map((day, ci) => {
            if (day === null) {
              return <View key={ci} style={gridStyles.cell} />;
            }
            const dayStr = formatDayStr(day);
            const isToday = dayStr === todayStr;
            const isSelected = dayStr === selectedDate;
            const hasEvents = getEventsForDate(dayStr).length > 0;

            return (
              <TouchableOpacity
                key={ci}
                style={gridStyles.cell}
                onPress={() => onSelectDate(dayStr)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    gridStyles.dayCircle,
                    isSelected && gridStyles.dayCircleSelected,
                    isToday && !isSelected && gridStyles.dayCircleToday,
                  ]}
                >
                  <Text
                    style={[
                      gridStyles.dayText,
                      isSelected && gridStyles.dayTextSelected,
                      isToday && !isSelected && gridStyles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {hasEvents && (
                  <View style={[gridStyles.dot, isSelected && { backgroundColor: '#000' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  headerText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayCircleSelected: {
    backgroundColor: colors.accent,
  },
  dayText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  dayTextToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
});

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { events, selectedDate, setSelectedDate, addEvent, deleteEvent, getEventsForDate } = useCalendarStore();

  const [viewMonth, setViewMonth] = useState(new Date());
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // Request notification permissions on mount (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifPermission(status as any);
    })();
  }, []);

  const handlePrevMonth = () => {
    setViewMonth((prev) => subMonths(prev, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => addMonths(prev, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddEvent = useCallback(
    async (eventData: Omit<CalendarEvent, 'id'>) => {
      const id = addEvent(eventData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Schedule notification if alert offset is set and permission granted
      if (eventData.alertOffset && notifPermission === 'granted') {
        const notifId = await scheduleEventNotification(
          eventData.title,
          eventData.startTime,
          eventData.alertOffset
        );
        if (notifId) {
          // Store notification ID on event
          const store = useCalendarStore.getState();
          store.updateEvent(id, { notificationId: notifId });
        }
      }
    },
    [addEvent, notifPermission]
  );

  const handleDeleteEvent = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvent(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [deleteEvent]
  );

  const selectedDateEvents = getEventsForDate(selectedDate).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const selectedDateFormatted = (() => {
    try {
      return format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d');
    } catch {
      return selectedDate;
    }
  })();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Notification permission banner ── */}
        {notifPermission === 'denied' && (
          <View style={styles.notifBanner}>
            <Ionicons name="notifications-off-outline" size={16} color={colors.warning} style={{ marginRight: 8 }} />
            <Text style={styles.notifBannerText}>Notifications are disabled.</Text>
            <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.notifBannerBtn}>
              <Text style={styles.notifBannerBtnText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Month navigation ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {format(viewMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Calendar grid ── */}
        <View style={styles.calendarCard}>
          <CalendarGrid
            viewMonth={viewMonth}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            getEventsForDate={getEventsForDate}
          />
        </View>

        {/* ── Day detail ── */}
        <View style={styles.dayDetailHeader}>
          <Text style={styles.dayDetailTitle}>
            {selectedDateFormatted}
          </Text>
          <Text style={styles.dayDetailCount}>
            {selectedDateEvents.length > 0 ? `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? 's' : ''}` : ''}
          </Text>
        </View>

        {selectedDateEvents.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>Nothing scheduled — enjoy the free time 😌</Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {selectedDateEvents.map((event) => {
              const catColor = categoryColors[event.category] ?? colors.textMuted;
              return (
                <View key={event.id} style={[styles.eventItem, { borderLeftColor: catColor }]}>
                  <View style={styles.eventItemContent}>
                    <View style={styles.eventItemTop}>
                      <Text style={styles.eventItemTitle}>{event.title}</Text>
                      <View style={[styles.catBadge, { backgroundColor: `${catColor}22` }]}>
                        <Text style={[styles.catBadgeText, { color: catColor }]}>{event.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.eventItemTime}>
                      {formatTime(new Date(event.startTime))} — {formatTime(new Date(event.endTime))}
                      {event.repeat !== 'none' ? `  ·  ${event.repeat}` : ''}
                    </Text>
                    {event.notes ? (
                      <Text style={styles.eventItemNotes} numberOfLines={2}>{event.notes}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteEvent(event.id)} style={styles.eventDeleteBtn}>
                    <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
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
        accessibilityLabel="Add event"
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      {/* ── Add Event Modal ── */}
      <AddEventModal
        visible={addModalVisible}
        selectedDate={selectedDate}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddEvent}
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
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.warning}44`,
    padding: 12,
    marginBottom: 14,
  },
  notifBannerText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.warning,
    flex: 1,
  },
  notifBannerBtn: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  notifBannerBtnText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.sm,
    color: '#000',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 22,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayDetailTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  dayDetailCount: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  emptyDay: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyDayText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  eventList: {
    gap: 10,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 14,
  },
  eventItemContent: {
    flex: 1,
    gap: 4,
  },
  eventItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventItemTitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  catBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catBadgeText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  eventItemTime: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  eventItemNotes: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
  eventDeleteBtn: {
    padding: 4,
    marginLeft: 8,
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
