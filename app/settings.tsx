import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useCalendarStore } from '@/store/useCalendarStore';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0D0F1A',
  surface: '#161824',
  surfaceElevated: '#1E2030',
  border: '#2A2D40',
  accent: '#C8F04A',
  coral: '#FF6B6B',
  success: '#4ADE80',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8FA8',
  textMuted: '#4A4D62',
};

// ---------------------------------------------------------------------------
// Avatar emoji palette (30 emojis, 5 rows × 6 columns)
// ---------------------------------------------------------------------------

const AVATAR_EMOJIS = [
  '😊', '😎', '🦁', '🐻', '🔥', '💪',
  '🧠', '👑', '🚀', '🌟', '⚡', '🎯',
  '🏆', '💡', '🌊', '🦊', '🐯', '🦅',
  '🌙', '☀️', '🌿', '🎭', '🎨', '🏋️',
  '🤸', '🧘', '🥊', '⚽', '🎸', '🌺',
];

// ---------------------------------------------------------------------------
// Helper sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      {children}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ---------------------------------------------------------------------------
// Main Settings Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  // Store selectors
  const {
    name,
    avatarEmoji,
    unit,
    startWeight,
    goalWeight,
    dailyCalorieGoal,
    defaultReminderTime,
    theme,
    quickMealChips,
    setName,
    setAvatarEmoji,
    setUnit,
    setStartWeight,
    setGoalWeight,
    setDailyCalorieGoal,
    setDefaultReminderTime,
    setTheme,
    setQuickMealChips,
    resetAll: resetUserStore,
  } = useUserStore();

  const resetNotesStore = useNotesStore.getState;
  const resetHabitsStore = useHabitsStore.getState;
  const resetBodyStore = useBodyStore.getState;

  // Local editable state
  const [localName, setLocalName] = useState(name);
  const [localStartWeight, setLocalStartWeight] = useState(String(startWeight));
  const [localGoalWeight, setLocalGoalWeight] = useState(String(goalWeight));
  const [localCalorieGoal, setLocalCalorieGoal] = useState(String(dailyCalorieGoal));
  const [localReminderTime, setLocalReminderTime] = useState(defaultReminderTime);

  // Notification permission
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'unknown'>('unknown');

  // Quick meal chips editor
  const [newChipName, setNewChipName] = useState('');
  const [newChipCalories, setNewChipCalories] = useState('');

  // Avatar picker modal
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Check notification permission on mount (native only)
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.getPermissionsAsync().then((result) => {
      if (result.granted) {
        setNotifStatus('granted');
      } else {
        setNotifStatus('denied');
      }
    });
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSaveProfile = useCallback(() => {
    setName(localName.trim());
  }, [localName, setName]);

  const handleSaveBodyGoals = useCallback(() => {
    const sw = parseFloat(localStartWeight) || 0;
    const gw = parseFloat(localGoalWeight) || 0;
    const cal = parseInt(localCalorieGoal, 10) || 2000;
    setStartWeight(sw);
    setGoalWeight(gw);
    setDailyCalorieGoal(cal);
  }, [localStartWeight, localGoalWeight, localCalorieGoal, setStartWeight, setGoalWeight, setDailyCalorieGoal]);

  const handleSaveReminderTime = useCallback(() => {
    setDefaultReminderTime(localReminderTime);
  }, [localReminderTime, setDefaultReminderTime]);

  const handleAddChip = useCallback(() => {
    if (!newChipName.trim()) return;
    if (quickMealChips.length >= 8) {
      Alert.alert('Max chips reached', 'You can have up to 8 quick-add meal chips.');
      return;
    }
    const cal = parseInt(newChipCalories, 10) || 0;
    setQuickMealChips([...quickMealChips, { name: newChipName.trim(), calories: cal }]);
    setNewChipName('');
    setNewChipCalories('');
  }, [newChipName, newChipCalories, quickMealChips, setQuickMealChips]);

  const handleRemoveChip = useCallback(
    (index: number) => {
      const updated = quickMealChips.filter((_, i) => i !== index);
      setQuickMealChips(updated);
    },
    [quickMealChips, setQuickMealChips]
  );

  const handleRequestNotifPermission = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const result = await Notifications.requestPermissionsAsync();
    setNotifStatus(result.granted ? 'granted' : 'denied');
  }, []);

  const handleExportData = useCallback(async () => {
    try {
      const allData = {
        user: useUserStore.getState(),
        notes: useNotesStore.getState(),
        habits: useHabitsStore.getState(),
        body: useBodyStore.getState(),
        calendar: useCalendarStore.getState(),
        exportedAt: new Date().toISOString(),
      };

      const json = JSON.stringify(allData, null, 2);

      if (Platform.OS === 'web') {
        // Web: trigger a file download via a temporary anchor element
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clutch-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(
        `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`,
        {
          mimeType: 'application/json',
          dialogTitle: 'Export Clutch Data',
          UTI: 'public.json',
        }
      );
    } catch (err) {
      console.warn('[Settings] Export error:', err);
      Alert.alert('Export failed', 'Something went wrong while exporting your data.');
    }
  }, []);

  const handleClearAllData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All notes, habits, body logs, and settings will be erased.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, clear it all',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.clear();
                    resetUserStore();
                    router.replace('/onboarding');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [resetUserStore]);

  // -------------------------------------------------------------------------
  // App version
  // -------------------------------------------------------------------------

  const appVersion =
    Constants.expoConfig?.version ?? '1.0.0';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---------------------------------------------------------------- */}
        {/* PROFILE                                                          */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="PROFILE" />
        <SectionCard>
          {/* Avatar picker */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Avatar</Text>
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(true)}
              style={styles.avatarButton}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
              <Text style={styles.avatarChangeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <Divider />

          {/* Name */}
          <View style={styles.column}>
            <Text style={styles.rowLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={localName}
              onChangeText={setLocalName}
              placeholder="Your name"
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.accent}
              returnKeyType="done"
            />
          </View>

          <Divider />

          <TouchableOpacity
            onPress={handleSaveProfile}
            style={styles.saveButton}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ---------------------------------------------------------------- */}
        {/* BODY GOALS                                                       */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="BODY GOALS" />
        <SectionCard>
          {/* Unit toggle */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Units</Text>
            <View style={styles.toggleRow}>
              {(['kg', 'lbs'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.togglePill, unit === u && styles.togglePillActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      unit === u && styles.togglePillTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Divider />

          {/* Start weight */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Start Weight</Text>
            <View style={styles.inlineInputWrap}>
              <TextInput
                style={styles.inlineInput}
                value={localStartWeight}
                onChangeText={setLocalStartWeight}
                keyboardType="decimal-pad"
                placeholder="80"
                placeholderTextColor={COLORS.textMuted}
                selectionColor={COLORS.accent}
              />
              <Text style={styles.inlineInputUnit}>{unit}</Text>
            </View>
          </View>

          <Divider />

          {/* Goal weight */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Goal Weight</Text>
            <View style={styles.inlineInputWrap}>
              <TextInput
                style={styles.inlineInput}
                value={localGoalWeight}
                onChangeText={setLocalGoalWeight}
                keyboardType="decimal-pad"
                placeholder="75"
                placeholderTextColor={COLORS.textMuted}
                selectionColor={COLORS.accent}
              />
              <Text style={styles.inlineInputUnit}>{unit}</Text>
            </View>
          </View>

          <Divider />

          {/* Daily calorie goal */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily Calories</Text>
            <View style={styles.inlineInputWrap}>
              <TextInput
                style={styles.inlineInput}
                value={localCalorieGoal}
                onChangeText={setLocalCalorieGoal}
                keyboardType="number-pad"
                placeholder="2000"
                placeholderTextColor={COLORS.textMuted}
                selectionColor={COLORS.accent}
              />
              <Text style={styles.inlineInputUnit}>kcal</Text>
            </View>
          </View>

          <Divider />

          <TouchableOpacity
            onPress={handleSaveBodyGoals}
            style={styles.saveButton}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Body Goals</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ---------------------------------------------------------------- */}
        {/* HABITS                                                           */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="HABITS" />
        <SectionCard>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Default Reminder</Text>
            <View style={styles.inlineInputWrap}>
              <TextInput
                style={styles.inlineInput}
                value={localReminderTime}
                onChangeText={setLocalReminderTime}
                placeholder="HH:MM"
                placeholderTextColor={COLORS.textMuted}
                selectionColor={COLORS.accent}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>
          <Divider />
          <TouchableOpacity
            onPress={handleSaveReminderTime}
            style={styles.saveButton}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Reminder Time</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ---------------------------------------------------------------- */}
        {/* MEALS                                                            */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="MEALS" />
        <SectionCard>
          <Text style={styles.rowLabelSmall}>Quick-Add Chips</Text>

          {quickMealChips.length > 0 ? (
            <View style={styles.chipList}>
              {quickMealChips.map((chip, index) => (
                <View key={`${chip.name}-${index}`} style={styles.chipItem}>
                  <View style={styles.chipInfo}>
                    <Text style={styles.chipName}>{chip.name}</Text>
                    <Text style={styles.chipCal}>{chip.calories} kcal</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveChip(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color={COLORS.coral} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyStateText}>No quick-add chips yet.</Text>
          )}

          {quickMealChips.length < 8 && (
            <>
              <Divider />
              <Text style={[styles.rowLabelSmall, { marginTop: 4 }]}>Add New Chip</Text>
              <View style={styles.addChipRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                  value={newChipName}
                  onChangeText={setNewChipName}
                  placeholder="Name"
                  placeholderTextColor={COLORS.textMuted}
                  selectionColor={COLORS.accent}
                />
                <TextInput
                  style={[styles.textInput, { width: 80 }]}
                  value={newChipCalories}
                  onChangeText={setNewChipCalories}
                  placeholder="kcal"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  selectionColor={COLORS.accent}
                />
                <TouchableOpacity
                  onPress={handleAddChip}
                  style={styles.addChipButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color={COLORS.bg} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {quickMealChips.length >= 8 && (
            <Text style={styles.maxChipsText}>Maximum 8 chips reached.</Text>
          )}
        </SectionCard>

        {/* ---------------------------------------------------------------- */}
        {/* APPEARANCE                                                       */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="APPEARANCE" />
        <SectionCard>
          <Text style={styles.rowLabelSmall}>Theme</Text>
          <View style={styles.segmentRow}>
            {(['dark', 'light', 'system'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTheme(t)}
                style={[
                  styles.segmentButton,
                  theme === t && styles.segmentButtonActive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    theme === t && styles.segmentButtonTextActive,
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* ---------------------------------------------------------------- */}
        {/* NOTIFICATIONS                                                    */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="NOTIFICATIONS" />
        <SectionCard>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Permission Status</Text>
            <Text
              style={[
                styles.permissionStatus,
                notifStatus === 'granted'
                  ? styles.permissionGranted
                  : notifStatus === 'denied'
                  ? styles.permissionDenied
                  : styles.permissionUnknown,
              ]}
            >
              {notifStatus === 'granted'
                ? 'Granted'
                : notifStatus === 'denied'
                ? 'Denied'
                : 'Unknown'}
            </Text>
          </View>

          {notifStatus !== 'granted' && (
            <>
              <Divider />
              <TouchableOpacity
                onPress={handleRequestNotifPermission}
                style={styles.saveButton}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Re-request Permission</Text>
              </TouchableOpacity>
            </>
          )}
        </SectionCard>

        {/* ---------------------------------------------------------------- */}
        {/* DATA                                                             */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="DATA" />
        <SectionCard>
          <TouchableOpacity
            onPress={handleExportData}
            style={styles.actionRow}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={COLORS.accent} />
            <Text style={styles.actionRowText}>Export Data</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            onPress={handleClearAllData}
            style={styles.actionRow}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.coral} />
            <Text style={[styles.actionRowText, { color: COLORS.coral }]}>
              Clear All Data
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </SectionCard>

        {/* ---------------------------------------------------------------- */}
        {/* ABOUT                                                            */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="ABOUT" />
        <SectionCard>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App Version</Text>
            <Text style={styles.versionText}>v{appVersion}</Text>
          </View>
          <Divider />
          <Text style={styles.aboutText}>
            Made with ❤️ for people who want to get their life together
          </Text>
        </SectionCard>
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Avatar picker modal                                                */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalSheet}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Avatar</Text>
            <View style={styles.emojiGrid}>
              {AVATAR_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    setAvatarEmoji(emoji);
                    setAvatarModalVisible(false);
                  }}
                  style={[
                    styles.emojiCell,
                    avatarEmoji === emoji && styles.emojiCellActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiCellText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  column: {
    paddingVertical: 12,
  },
  rowLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  rowLabelSmall: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingVertical: 10,
  },
  textInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  inlineInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineInput: {
    fontFamily: 'Syne_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    minWidth: 60,
    textAlign: 'right',
    padding: 0,
  },
  inlineInputUnit: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 12,
  },
  saveButtonText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 15,
    color: COLORS.bg,
  },
  // Unit toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    padding: 3,
  },
  togglePill: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 8,
  },
  togglePillActive: {
    backgroundColor: COLORS.accent,
  },
  togglePillText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  togglePillTextActive: {
    color: COLORS.bg,
    fontFamily: 'Syne_700Bold',
  },
  // Quick meal chips
  chipList: {
    gap: 8,
    paddingBottom: 8,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  chipCal: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  addChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addChipButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxChipsText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
  emptyStateText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Appearance segmented control
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginVertical: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.accent,
  },
  segmentButtonText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  segmentButtonTextActive: {
    color: COLORS.bg,
    fontFamily: 'Syne_700Bold',
  },
  // Notifications
  permissionStatus: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
  },
  permissionGranted: {
    color: COLORS.success,
  },
  permissionDenied: {
    color: COLORS.coral,
  },
  permissionUnknown: {
    color: COLORS.textSecondary,
  },
  // Data actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  actionRowText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  // About
  versionText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  aboutText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 14,
    lineHeight: 20,
  },
  // Avatar picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiCellActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(200,240,74,0.12)',
  },
  emojiCellText: {
    fontSize: 28,
  },
  // Avatar button in profile section
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarChangeText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.accent,
  },
});
