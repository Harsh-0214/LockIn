import React, { useState, useCallback } from 'react';
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
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { format, parseISO } from 'date-fns';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { formatTime } from '@/utils/dateHelpers';

import { useUserStore } from '@/store/useUserStore';
import { useBodyStore } from '@/store/useBodyStore';

import Card from '@/components/ui/Card';
import RingProgress from '@/components/ui/RingProgress';

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkoutType = 'Lift' | 'Cardio' | 'Walk' | 'Sport' | 'Other';

const WORKOUT_TYPES: WorkoutType[] = ['Lift', 'Cardio', 'Walk', 'Sport', 'Other'];

const WORKOUT_TYPE_ICONS: Record<WorkoutType, string> = {
  Lift: 'barbell',
  Cardio: 'bicycle',
  Walk: 'walk',
  Sport: 'football',
  Other: 'fitness',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BodyScreen() {
  const { unit, setUnit, dailyCalorieGoal, goalWeight, startWeight } = useUserStore();
  const {
    weightEntries,
    addWeightEntry,
    addMeal,
    deleteMeal,
    addWorkout,
    waterGlasses,
    setWaterGlasses,
    getTodayCalories,
    getTodayMeals,
    getTodayWorkout,
    getWeightTrend,
    getWeeklyWorkouts,
  } = useBodyStore();

  // ── Weight modal ──
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  // ── Meal modal ──
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [showMacros, setShowMacros] = useState(false);
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  // ── Workout modal ──
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('Lift');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const todayCalories = getTodayCalories();
  const todayMeals = getTodayMeals();
  const todayWorkout = getTodayWorkout();
  const trend = getWeightTrend();
  const weeklyWorkouts = getWeeklyWorkouts();

  const { quickMealChips } = useUserStore();

  // Sort weight entries newest first
  const sortedEntries = [...weightEntries].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );
  const last7 = sortedEntries.slice(0, 7).reverse();
  const currentWeight = sortedEntries[0]?.weight ?? 0;

  // ── Weight chart data ──
  const lineData = last7.map((e, i) => ({
    value: e.weight,
    label: format(parseISO(e.loggedAt), 'M/d'),
    dataPointColor: colors.accent,
  }));

  // ── Bar chart data ──
  const barData = weeklyWorkouts.map((mins, i) => ({
    value: mins,
    label: DAY_LABELS[i],
    frontColor: mins > 0 ? colors.accent : colors.border,
  }));

  // ── Handlers ──

  const handleLogWeight = useCallback(() => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) {
      Alert.alert('Invalid', 'Please enter a valid weight.');
      return;
    }
    addWeightEntry(w, unit);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWeightInput('');
    setWeightModalVisible(false);
  }, [weightInput, unit, addWeightEntry]);

  const handleLogMeal = useCallback(() => {
    if (!mealName.trim()) {
      Alert.alert('Invalid', 'Please enter a meal name.');
      return;
    }
    const cals = parseInt(mealCalories, 10);
    if (isNaN(cals) || cals < 0) {
      Alert.alert('Invalid', 'Please enter valid calories.');
      return;
    }
    const meal: any = { name: mealName.trim(), calories: cals };
    if (showMacros) {
      const p = parseFloat(mealProtein);
      const c = parseFloat(mealCarbs);
      const f = parseFloat(mealFat);
      if (!isNaN(p)) meal.protein = p;
      if (!isNaN(c)) meal.carbs = c;
      if (!isNaN(f)) meal.fat = f;
    }
    addMeal(meal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    setShowMacros(false);
    setMealModalVisible(false);
  }, [mealName, mealCalories, showMacros, mealProtein, mealCarbs, mealFat, addMeal]);

  const handleLogWorkout = useCallback(() => {
    const dur = parseInt(workoutDuration, 10);
    if (isNaN(dur) || dur <= 0) {
      Alert.alert('Invalid', 'Please enter a valid duration in minutes.');
      return;
    }
    addWorkout({ type: workoutType, durationMinutes: dur, notes: workoutNotes.trim() || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWorkoutDuration('');
    setWorkoutNotes('');
    setWorkoutModalVisible(false);
  }, [workoutType, workoutDuration, workoutNotes, addWorkout]);

  const handleDeleteMeal = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteMeal(id);
  }, [deleteMeal]);

  const handleWaterTap = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Tap filled cup = unfill (reduce count), tap empty = fill
    const newCount = index < waterGlasses ? index : index + 1;
    setWaterGlasses(newCount);
  }, [waterGlasses, setWaterGlasses]);

  const handleQuickMealChip = useCallback((chip: { name: string; calories: number }) => {
    addMeal({ name: chip.name, calories: chip.calories });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [addMeal]);

  const weightLost = startWeight - currentWeight;
  const trendMsg =
    trend === 'down'
      ? "Great progress! You're trending lighter."
      : trend === 'up'
      ? 'Weight trending up. Stay consistent.'
      : 'Weight is stable. Keep it up!';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ── */}
        <Text style={styles.screenTitle}>Body</Text>

        {/* ══════════════════ WEIGHT ══════════════════ */}
        <Text style={styles.sectionTitle}>Weight</Text>

        {/* Unit toggle + Log button */}
        <View style={styles.weightHeader}>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
              onPress={() => { setUnit('kg'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.unitBtnText, unit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
              onPress={() => { setUnit('lbs'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.unitBtnText, unit === 'lbs' && styles.unitBtnTextActive]}>lbs</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.logBtn} onPress={() => setWeightModalVisible(true)}>
            <Ionicons name="add-circle" size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.logBtnText}>Log Weight</Text>
          </TouchableOpacity>
        </View>

        {/* Weight chart */}
        {last7.length >= 2 ? (
          <Card style={styles.chartCard}>
            <LineChart
              data={lineData}
              width={280}
              height={140}
              color={colors.accent}
              thickness={2}
              dataPointsColor={colors.accent}
              dataPointsRadius={4}
              startFillColor={`${colors.accent}33`}
              endFillColor={`${colors.accent}00`}
              areaChart
              curved
              hideRules
              xAxisColor={colors.border}
              yAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontFamily: typography.fontBody }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9, fontFamily: typography.fontBody }}
              noOfSections={4}
              backgroundColor={colors.surface}
            />
          </Card>
        ) : (
          <Card style={[styles.chartCard, styles.emptyChart]}>
            <Text style={styles.emptyText}>Log at least 2 weights to see your chart</Text>
          </Card>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Current', value: currentWeight > 0 ? `${currentWeight}` : '—' },
            { label: 'Start', value: startWeight > 0 ? `${startWeight}` : '—' },
            { label: 'Goal', value: goalWeight > 0 ? `${goalWeight}` : '—' },
            { label: 'Lost', value: currentWeight > 0 && startWeight > 0 ? `${Math.abs(weightLost).toFixed(1)}` : '—' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.trendMsg}>{trendMsg}</Text>

        {/* ══════════════════ CALORIES ══════════════════ */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Calories</Text>

        <Card style={styles.caloriesCard}>
          <View style={styles.caloriesRingRow}>
            <RingProgress
              progress={dailyCalorieGoal > 0 ? Math.min(1, todayCalories / dailyCalorieGoal) : 0}
              size={110}
              strokeWidth={11}
              color={todayCalories > dailyCalorieGoal ? colors.coral : colors.accent}
            >
              <View style={styles.ringCenter}>
                <Text style={styles.ringValue}>{todayCalories}</Text>
                <Text style={styles.ringLabel}>eaten</Text>
              </View>
            </RingProgress>
            <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesGoalText}>Goal: {dailyCalorieGoal} kcal</Text>
              <Text style={styles.caloriesRemaining}>
                {dailyCalorieGoal - todayCalories > 0
                  ? `${dailyCalorieGoal - todayCalories} remaining`
                  : `${todayCalories - dailyCalorieGoal} over`}
              </Text>
              <TouchableOpacity style={styles.logMealBtn} onPress={() => setMealModalVisible(true)}>
                <Ionicons name="add-circle" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.logBtnText}>Log Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Quick-add chips */}
        {quickMealChips && quickMealChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {quickMealChips.map((chip) => (
              <TouchableOpacity
                key={chip.name}
                style={styles.chip}
                onPress={() => handleQuickMealChip(chip)}
              >
                <Text style={styles.chipText}>{chip.name}</Text>
                <Text style={styles.chipCals}>{chip.calories} kcal</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Meal list */}
        {todayMeals.length > 0 && (
          <View style={styles.mealList}>
            {todayMeals.map((meal) => (
              <View key={meal.id} style={styles.mealRow}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealDetails}>
                    {meal.calories} kcal
                    {meal.protein != null ? ` · P: ${meal.protein}g` : ''}
                    {meal.carbs != null ? ` · C: ${meal.carbs}g` : ''}
                    {meal.fat != null ? ` · F: ${meal.fat}g` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} style={styles.mealDeleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.coral} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ══════════════════ WATER ══════════════════ */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Water</Text>

        <Card style={styles.waterCard}>
          <View style={styles.waterCupsRow}>
            {Array.from({ length: 8 }, (_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleWaterTap(i)}
                style={styles.cupBtn}
                accessibilityLabel={`Glass ${i + 1}${i < waterGlasses ? ', filled' : ''}`}
              >
                <Ionicons
                  name={i < waterGlasses ? 'water' : 'water-outline'}
                  size={28}
                  color={i < waterGlasses ? colors.water : colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.waterLabel}>{waterGlasses} / 8 glasses</Text>
        </Card>

        {/* ══════════════════ WORKOUT ══════════════════ */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Workout</Text>

        <TouchableOpacity style={styles.logWorkoutBtn} onPress={() => setWorkoutModalVisible(true)}>
          <Ionicons name="add-circle" size={18} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.logBtnText}>Log Workout</Text>
        </TouchableOpacity>

        {todayWorkout ? (
          <Card style={styles.workoutCard}>
            <View style={styles.workoutCardRow}>
              <View style={[styles.workoutTypeIcon, { backgroundColor: `${colors.accent}22` }]}>
                <Ionicons name={(WORKOUT_TYPE_ICONS[todayWorkout.type as WorkoutType] ?? 'fitness') as any} size={22} color={colors.accent} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutType}>{todayWorkout.type}</Text>
                <Text style={styles.workoutDuration}>{todayWorkout.durationMinutes} min</Text>
                {todayWorkout.notes ? (
                  <Text style={styles.workoutNotes} numberOfLines={2}>{todayWorkout.notes}</Text>
                ) : null}
              </View>
            </View>
          </Card>
        ) : (
          <Card style={[styles.workoutCard, styles.emptyChart]}>
            <Text style={styles.emptyText}>No workout logged today</Text>
          </Card>
        )}

        {/* Weekly bar chart */}
        <Card style={[styles.chartCard, { marginTop: 16 }]}>
          <Text style={styles.weeklyChartTitle}>This Week</Text>
          <BarChart
            data={barData}
            width={280}
            height={120}
            barWidth={26}
            spacing={12}
            roundedTop
            hideRules
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontFamily: typography.fontBody }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontFamily: typography.fontBody }}
            noOfSections={3}
            backgroundColor={colors.surface}
            labelWidth={20}
          />
        </Card>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ══════════════════ WEIGHT MODAL ══════════════════ */}
      <Modal visible={weightModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Text style={styles.modalSubtitle}>Enter your current weight in {unit}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`e.g. ${unit === 'kg' ? '78.5' : '173.0'}`}
              placeholderTextColor={colors.textMuted}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setWeightInput(''); setWeightModalVisible(false); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleLogWeight}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════ MEAL MODAL ══════════════════ */}
      <Modal visible={mealModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={[styles.modalSheet, { marginTop: 'auto' }]}>
              <Text style={styles.modalTitle}>Log Meal</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Meal name"
                placeholderTextColor={colors.textMuted}
                value={mealName}
                onChangeText={setMealName}
                autoFocus
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Calories"
                placeholderTextColor={colors.textMuted}
                value={mealCalories}
                onChangeText={setMealCalories}
                keyboardType="number-pad"
              />
              <View style={styles.macrosToggleRow}>
                <Text style={styles.macrosToggleLabel}>Add macros (optional)</Text>
                <Switch
                  value={showMacros}
                  onValueChange={setShowMacros}
                  trackColor={{ false: colors.border, true: `${colors.accent}88` }}
                  thumbColor={showMacros ? colors.accent : colors.textMuted}
                />
              </View>
              {showMacros && (
                <View style={styles.macrosRow}>
                  <TextInput
                    style={[styles.modalInput, styles.macroInput]}
                    placeholder="Protein (g)"
                    placeholderTextColor={colors.textMuted}
                    value={mealProtein}
                    onChangeText={setMealProtein}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={[styles.modalInput, styles.macroInput]}
                    placeholder="Carbs (g)"
                    placeholderTextColor={colors.textMuted}
                    value={mealCarbs}
                    onChangeText={setMealCarbs}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={[styles.modalInput, styles.macroInput]}
                    placeholder="Fat (g)"
                    placeholderTextColor={colors.textMuted}
                    value={mealFat}
                    onChangeText={setMealFat}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setMealName(''); setMealCalories('');
                    setMealProtein(''); setMealCarbs(''); setMealFat('');
                    setShowMacros(false);
                    setMealModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleLogMeal}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ══════════════════ WORKOUT MODAL ══════════════════ */}
      <Modal visible={workoutModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            {/* Type picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, workoutType === t && styles.typeBtnActive]}
                  onPress={() => { setWorkoutType(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Ionicons
                    name={(WORKOUT_TYPE_ICONS[t] as any) ?? 'fitness'}
                    size={16}
                    color={workoutType === t ? '#000' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.typeBtnText, workoutType === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Duration (minutes)"
              placeholderTextColor={colors.textMuted}
              value={workoutDuration}
              onChangeText={setWorkoutDuration}
              keyboardType="number-pad"
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { height: 72 }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textMuted}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setWorkoutDuration(''); setWorkoutNotes('');
                  setWorkoutModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleLogWorkout}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Weight section
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  unitBtnActive: {
    backgroundColor: colors.accent,
  },
  unitBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: '#000',
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  chartCard: {
    padding: 16,
    overflow: 'hidden',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  trendMsg: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  // Calories section
  caloriesCard: {
    padding: 16,
  },
  caloriesRingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringValue: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  ringLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  caloriesInfo: {
    flex: 1,
    gap: 6,
  },
  caloriesGoalText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  caloriesRemaining: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  logMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  chipsScroll: {
    marginTop: 14,
  },
  chipsContent: {
    paddingRight: 20,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  chipText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  chipCals: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  mealList: {
    marginTop: 14,
    gap: 8,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  mealDetails: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  mealDeleteBtn: {
    padding: 6,
  },
  // Water section
  waterCard: {
    padding: 16,
    alignItems: 'center',
  },
  waterCupsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cupBtn: {
    padding: 4,
  },
  waterLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  // Workout section
  logWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  workoutCard: {
    padding: 16,
  },
  workoutCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  workoutTypeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  workoutDuration: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  workoutNotes: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  weeklyChartTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 10,
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
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 14,
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
  macrosToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  macrosToggleLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroInput: {
    flex: 1,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  typeBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  typeBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#000',
  },
});
