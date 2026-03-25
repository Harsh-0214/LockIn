import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Feature items for Screen 2
// ---------------------------------------------------------------------------

const FEATURES = [
  { emoji: '🏋️', label: 'Body & Fitness Tracking' },
  { emoji: '📝', label: 'Smart Notes' },
  { emoji: '📅', label: 'Calendar & Reminders' },
  { emoji: '🔥', label: 'Habit Streaks' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PaginationDots({ current }: { current: number }) {
  return (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen 0 — Welcome
// ---------------------------------------------------------------------------

interface Screen0Props {
  name: string;
  onChangeName: (v: string) => void;
}

function Screen0({ name, onChangeName }: Screen0Props) {
  return (
    <View style={styles.screenContent}>
      {/* Bouncing emoji */}
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{
          type: 'timing',
          duration: 800,
          loop: true,
          repeatReverse: false,
        }}
        style={styles.emojiWrap}
      >
        <Text style={styles.bigEmoji}>👋</Text>
      </MotiView>

      <Text style={styles.headingLg}>Hey, what's your name?</Text>

      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={onChangeName}
        placeholder="Your name..."
        placeholderTextColor={COLORS.textMuted}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        selectionColor={COLORS.accent}
      />

      <Text style={styles.subtext}>No judgment zone. Really.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen 1 — Body Goals
// ---------------------------------------------------------------------------

interface Screen1Props {
  unit: 'kg' | 'lbs';
  onChangeUnit: (u: 'kg' | 'lbs') => void;
  startWeight: string;
  onChangeStartWeight: (v: string) => void;
  goalWeight: string;
  onChangeGoalWeight: (v: string) => void;
  dailyCalorieGoal: string;
  onChangeDailyCalorieGoal: (v: string) => void;
}

function Screen1({
  unit,
  onChangeUnit,
  startWeight,
  onChangeStartWeight,
  goalWeight,
  onChangeGoalWeight,
  dailyCalorieGoal,
  onChangeDailyCalorieGoal,
}: Screen1Props) {
  return (
    <ScrollView
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headingMd}>Let's set your targets</Text>
      <Text style={styles.subtitleText}>
        You can change these anytime in settings
      </Text>

      {/* Unit toggle */}
      <View style={styles.toggleRow}>
        {(['kg', 'lbs'] as const).map((u) => (
          <TouchableOpacity
            key={u}
            style={[
              styles.togglePill,
              unit === u && styles.togglePillActive,
            ]}
            onPress={() => onChangeUnit(u)}
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

      {/* Weight row */}
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Current Weight</Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              style={styles.numericInput}
              value={startWeight}
              onChangeText={onChangeStartWeight}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.accent}
            />
            <Text style={styles.unitLabel}>{unit}</Text>
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Goal Weight</Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              style={styles.numericInput}
              value={goalWeight}
              onChangeText={onChangeGoalWeight}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.accent}
            />
            <Text style={styles.unitLabel}>{unit}</Text>
          </View>
        </View>
      </View>

      {/* Calorie goal */}
      <View style={[styles.inputGroup, { width: '100%', marginTop: 20 }]}>
        <Text style={styles.inputLabel}>Daily Calorie Goal</Text>
        <View style={styles.inputWithUnit}>
          <TextInput
            style={styles.numericInput}
            value={dailyCalorieGoal}
            onChangeText={onChangeDailyCalorieGoal}
            keyboardType="number-pad"
            placeholder="2000"
            placeholderTextColor={COLORS.textMuted}
            selectionColor={COLORS.accent}
          />
          <Text style={styles.unitLabel}>kcal</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Screen 2 — Ready
// ---------------------------------------------------------------------------

interface Screen2Props {
  name: string;
}

function Screen2({ name }: Screen2Props) {
  return (
    <View style={styles.screenContent}>
      <Text style={styles.headingXl}>Clutch is ready.</Text>
      <Text style={styles.subtitleText}>Here's what you've got:</Text>

      <View style={styles.featureList}>
        {FEATURES.map((f, i) => (
          <MotiView
            key={f.label}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: i * 200,
            }}
            style={styles.featureItem}
          >
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </MotiView>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  // Wizard state
  const [currentScreen, setCurrentScreen] = useState(0);
  const [name, setName] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('2000');

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = useCallback(
    (direction: 'forward' | 'back', next: number) => {
      const toValue = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;
      Animated.timing(slideAnim, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentScreen(next);
        slideAnim.setValue(-toValue);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    },
    [slideAnim]
  );

  const handleNext = useCallback(() => {
    if (currentScreen < 2) {
      animateTransition('forward', currentScreen + 1);
    }
  }, [currentScreen, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentScreen > 0) {
      animateTransition('back', currentScreen - 1);
    }
  }, [currentScreen, animateTransition]);

  const handleFinish = useCallback(async () => {
    const sw = parseFloat(startWeight) || 0;
    const gw = parseFloat(goalWeight) || 0;
    const cal = parseInt(dailyCalorieGoal, 10) || 2000;

    completeOnboarding({
      name: name.trim(),
      startWeight: sw,
      goalWeight: gw,
      unit,
      dailyCalorieGoal: cal,
    });

    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/(tabs)');
  }, [name, startWeight, goalWeight, unit, dailyCalorieGoal, completeOnboarding]);

  const isNextDisabled = currentScreen === 0 && name.trim().length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        {currentScreen > 0 ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <PaginationDots current={currentScreen} />

        {/* Spacer to balance the back button */}
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Animated slide area */}
      <Animated.View
        style={[
          styles.slideContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {currentScreen === 0 && (
          <Screen0 name={name} onChangeName={setName} />
        )}
        {currentScreen === 1 && (
          <Screen1
            unit={unit}
            onChangeUnit={setUnit}
            startWeight={startWeight}
            onChangeStartWeight={setStartWeight}
            goalWeight={goalWeight}
            onChangeGoalWeight={setGoalWeight}
            dailyCalorieGoal={dailyCalorieGoal}
            onChangeDailyCalorieGoal={setDailyCalorieGoal}
          />
        )}
        {currentScreen === 2 && <Screen2 name={name} />}
      </Animated.View>

      {/* Bottom button */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {currentScreen < 2 ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isNextDisabled && styles.primaryButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={isNextDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFinish}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Let's Go 🔥</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    height: 56,
  },
  backButton: {
    paddingVertical: 4,
    width: 60,
  },
  backButtonText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  backButtonPlaceholder: {
    width: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 24,
  },
  dotInactive: {
    backgroundColor: COLORS.textMuted,
    width: 8,
  },
  slideContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    paddingHorizontal: 28,
  },
  screenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    width: '100%',
  },
  emojiWrap: {
    marginBottom: 28,
  },
  bigEmoji: {
    fontSize: 72,
  },
  headingXl: {
    fontFamily: 'Syne_700Bold',
    fontSize: 36,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  headingLg: {
    fontFamily: 'Syne_700Bold',
    fontSize: 30,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
  },
  headingMd: {
    fontFamily: 'Syne_700Bold',
    fontSize: 26,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  subtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  // Name input — large, centered, underline style
  nameInput: {
    fontFamily: 'Syne_700Bold',
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
  },
  // Unit toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
    alignSelf: 'center',
  },
  togglePill: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  togglePillActive: {
    backgroundColor: COLORS.accent,
  },
  togglePillText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  togglePillTextActive: {
    color: COLORS.bg,
    fontFamily: 'Syne_700Bold',
  },
  // Two-column layout
  inputRow: {
    flexDirection: 'row',
    width: '100%',
  },
  inputGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numericInput: {
    flex: 1,
    fontFamily: 'Syne_700Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    padding: 0,
  },
  unitLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  // Features
  featureList: {
    width: '100%',
    marginTop: 12,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  // Bottom action bar
  bottomBar: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  primaryButtonText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 17,
    color: COLORS.bg,
  },
});
