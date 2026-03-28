// /home/user/LockIn/store/useUserStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickMealChip {
  name: string;
  calories: number;
}

interface UserState {
  name: string;
  avatarEmoji: string;
  unit: 'kg' | 'lbs';
  goalWeight: number;
  startWeight: number;
  dailyCalorieGoal: number;
  defaultReminderTime: string; // "HH:MM"
  theme: 'dark' | 'light' | 'system';
  quickMealChips: QuickMealChip[];
  onboardingComplete: boolean;

  // actions
  setName: (name: string) => void;
  setAvatarEmoji: (emoji: string) => void;
  setUnit: (unit: 'kg' | 'lbs') => void;
  setGoalWeight: (w: number) => void;
  setStartWeight: (w: number) => void;
  setDailyCalorieGoal: (cal: number) => void;
  setDefaultReminderTime: (time: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setQuickMealChips: (chips: QuickMealChip[]) => void;
  completeOnboarding: (data: {
    name: string;
    startWeight: number;
    goalWeight: number;
    unit: 'kg' | 'lbs';
    dailyCalorieGoal: number;
  }) => void;
  resetAll: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_QUICK_MEAL_CHIPS: QuickMealChip[] = [
  { name: 'Protein Shake', calories: 150 },
  { name: 'Coffee', calories: 5 },
  { name: 'Banana', calories: 90 },
  { name: 'Rice bowl', calories: 350 },
];

const defaultState = {
  name: '',
  avatarEmoji: '🧑',
  unit: 'kg' as const,
  goalWeight: 75,
  startWeight: 80,
  dailyCalorieGoal: 2000,
  defaultReminderTime: '08:00',
  theme: 'dark' as const,
  quickMealChips: DEFAULT_QUICK_MEAL_CHIPS,
  onboardingComplete: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...defaultState,

      setName: (name) => set({ name }),

      setAvatarEmoji: (emoji) => set({ avatarEmoji: emoji }),

      setUnit: (unit) => set({ unit }),

      setGoalWeight: (w) => set({ goalWeight: w }),

      setStartWeight: (w) => set({ startWeight: w }),

      setDailyCalorieGoal: (cal) => set({ dailyCalorieGoal: cal }),

      setDefaultReminderTime: (time) => set({ defaultReminderTime: time }),

      setTheme: (theme) => set({ theme }),

      setQuickMealChips: (chips) => set({ quickMealChips: chips }),

      completeOnboarding: (data) =>
        set({
          name: data.name,
          startWeight: data.startWeight,
          goalWeight: data.goalWeight,
          unit: data.unit,
          dailyCalorieGoal: data.dailyCalorieGoal,
          onboardingComplete: true,
        }),

      resetAll: () => set({ ...defaultState }),
    }),
    {
      name: 'clutch-user-store',
    }
  )
);
