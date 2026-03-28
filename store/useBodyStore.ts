// /home/user/LockIn/store/useBodyStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, subDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeightEntry {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  loggedAt: string; // ISO string
}

export interface MealLog {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  loggedAt: string; // ISO string
}

export interface WorkoutSession {
  id: string;
  type: string; // 'Lift' | 'Cardio' | 'Walk' | 'Sport' | 'Other'
  durationMinutes: number;
  notes?: string;
  loggedAt: string; // ISO string
}

interface BodyState {
  weightEntries: WeightEntry[];
  mealLogs: MealLog[];
  workoutSessions: WorkoutSession[];
  waterGlasses: number; // today's count
  waterDate: string; // YYYY-MM-DD of last water log

  // actions
  addWeightEntry: (weight: number, unit: 'kg' | 'lbs') => void;
  deleteWeightEntry: (id: string) => void;
  addMeal: (meal: Omit<MealLog, 'id' | 'loggedAt'>) => void;
  deleteMeal: (id: string) => void;
  addWorkout: (session: Omit<WorkoutSession, 'id' | 'loggedAt'>) => void;
  setWaterGlasses: (count: number) => void;

  // selectors
  getTodayCalories: () => number;
  getTodayMeals: () => MealLog[];
  getTodayWorkout: () => WorkoutSession | undefined;
  getWeightTrend: () => 'up' | 'down' | 'stable';
  getWeeklyWorkouts: () => number[]; // 7 values Mon-Sun as minute counts
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(): string {
  return Math.random().toString(36).substr(2, 9);
}

const TODAY = format(new Date(), 'yyyy-MM-dd');

/** Returns an ISO string for today at the given hour offset. */
function todayISO(offsetHours = 0): string {
  const d = new Date();
  d.setHours(offsetHours, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const seedWeightEntries: WeightEntry[] = (() => {
  const weights = [79.2, 78.8, 79.0, 78.6, 78.9, 78.4, 78.7];
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    date.setHours(7, 30, 0, 0);
    return {
      id: genId(),
      weight: weights[i],
      unit: 'kg' as const,
      loggedAt: date.toISOString(),
    };
  });
})();

const seedMealLogs: MealLog[] = [
  {
    id: genId(),
    name: 'Oats with berries',
    calories: 320,
    protein: 12,
    carbs: 54,
    fat: 6,
    loggedAt: todayISO(8),
  },
  {
    id: genId(),
    name: 'Grilled chicken & rice',
    calories: 480,
    protein: 42,
    carbs: 48,
    fat: 10,
    loggedAt: todayISO(12),
  },
  {
    id: genId(),
    name: 'Protein shake',
    calories: 150,
    protein: 25,
    carbs: 8,
    fat: 3,
    loggedAt: todayISO(15),
  },
];

const seedWorkoutSessions: WorkoutSession[] = [
  {
    id: genId(),
    type: 'Lift',
    durationMinutes: 55,
    notes: 'Push day — bench, OHP, tricep dips. Felt strong.',
    loggedAt: todayISO(6),
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBodyStore = create<BodyState>()(
  persist(
    (set, get) => ({
      weightEntries: seedWeightEntries,
      mealLogs: seedMealLogs,
      workoutSessions: seedWorkoutSessions,
      waterGlasses: 3,
      waterDate: TODAY,

      // -----------------------------------------------------------------------
      // Weight
      // -----------------------------------------------------------------------
      addWeightEntry: (weight, unit) => {
        const entry: WeightEntry = {
          id: genId(),
          weight,
          unit,
          loggedAt: new Date().toISOString(),
        };
        set((state) => ({
          weightEntries: [entry, ...state.weightEntries].sort(
            (a, b) =>
              new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
          ),
        }));
      },

      deleteWeightEntry: (id) => {
        set((state) => ({
          weightEntries: state.weightEntries.filter((e) => e.id !== id),
        }));
      },

      // -----------------------------------------------------------------------
      // Meals
      // -----------------------------------------------------------------------
      addMeal: (meal) => {
        const entry: MealLog = {
          ...meal,
          id: genId(),
          loggedAt: new Date().toISOString(),
        };
        set((state) => ({
          mealLogs: [entry, ...state.mealLogs],
        }));
      },

      deleteMeal: (id) => {
        set((state) => ({
          mealLogs: state.mealLogs.filter((m) => m.id !== id),
        }));
      },

      // -----------------------------------------------------------------------
      // Workouts
      // -----------------------------------------------------------------------
      addWorkout: (session) => {
        const entry: WorkoutSession = {
          ...session,
          id: genId(),
          loggedAt: new Date().toISOString(),
        };
        set((state) => ({
          workoutSessions: [entry, ...state.workoutSessions],
        }));
      },

      // -----------------------------------------------------------------------
      // Water
      // -----------------------------------------------------------------------
      setWaterGlasses: (count) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        set({ waterGlasses: count, waterDate: today });
      },

      // -----------------------------------------------------------------------
      // Selectors
      // -----------------------------------------------------------------------
      getTodayCalories: () => {
        const { mealLogs } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        return mealLogs
          .filter(
            (m) => format(parseISO(m.loggedAt), 'yyyy-MM-dd') === today
          )
          .reduce((sum, m) => sum + m.calories, 0);
      },

      getTodayMeals: () => {
        const { mealLogs } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        return mealLogs.filter(
          (m) => format(parseISO(m.loggedAt), 'yyyy-MM-dd') === today
        );
      },

      getTodayWorkout: () => {
        const { workoutSessions } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        return workoutSessions.find(
          (s) => format(parseISO(s.loggedAt), 'yyyy-MM-dd') === today
        );
      },

      getWeightTrend: () => {
        const { weightEntries } = get();
        if (weightEntries.length < 2) return 'stable';
        const sorted = [...weightEntries].sort(
          (a, b) =>
            new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
        );
        const latest = sorted[0].weight;
        const previous = sorted[1].weight;
        const diff = latest - previous;
        if (Math.abs(diff) < 0.2) return 'stable';
        return diff > 0 ? 'up' : 'down';
      },

      getWeeklyWorkouts: () => {
        const { workoutSessions } = get();
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const result = Array(7).fill(0);
        workoutSessions.forEach((s) => {
          const d = parseISO(s.loggedAt);
          for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            if (isSameDay(d, day)) {
              result[i] += s.durationMinutes;
            }
          }
        });
        return result;
      },
    }),
    {
      name: 'clutch-body-store',
    }
  )
);
