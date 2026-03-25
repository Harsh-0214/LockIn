import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  format,
  subDays,
  parseISO,
  getDay,
  getYear,
  getMonth,
} from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Habit {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
  /**
   * 'daily' means every day.
   * Comma-separated day abbreviations for a custom schedule, e.g. 'mon,wed,fri'.
   * Valid abbreviations: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
   */
  frequency: string;
  reminderTime?: string; // "HH:MM"
  graceDay: boolean;
  archived: boolean;
  createdAt: string; // ISO string
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedAt: string; // YYYY-MM-DD
}

interface HabitsState {
  habits: Habit[];
  habitLogs: HabitLog[];

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  archiveHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  /** Toggles the completion log for the given habit on the given YYYY-MM-DD date. */
  toggleHabitLog: (habitId: string, date: string) => void;

  isHabitCompleted: (habitId: string, date: string) => boolean;
  getCurrentStreak: (habitId: string) => number;
  getLongestStreak: (habitId: string) => number;
  /** Returns completion rate (0–1) for the last N days. */
  getCompletionRate: (habitId: string, days: number) => number;
  /** Returns array of 'YYYY-MM-DD' strings completed within the given month (1-indexed). */
  getHabitLogsForMonth: (habitId: string, year: number, month: number) => string[];
  /** Returns active (non-archived) habits scheduled for today. */
  getTodayHabits: () => Habit[];
  /** True when every habit scheduled for today has been logged. */
  areAllTodayHabitsDone: () => boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/** Returns 'YYYY-MM-DD' for N days ago. */
function dateStr(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
}

/** 3-letter weekday abbreviation for a given 'YYYY-MM-DD' string. */
function weekdayAbbr(dateString: string): string {
  const day = getDay(parseISO(dateString)); // 0 = Sun … 6 = Sat
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day];
}

/**
 * Returns true when the habit is scheduled on the given YYYY-MM-DD date,
 * based on its frequency string ('daily' or comma-separated abbreviations).
 */
function isScheduledForDate(habit: Habit, dateString: string): boolean {
  if (habit.frequency === 'daily') return true;
  const abbr = weekdayAbbr(dateString);
  return habit.frequency
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .includes(abbr);
}

// ---------------------------------------------------------------------------
// Fixed seed IDs so habit log references are deterministic
// ---------------------------------------------------------------------------

const HABIT_IDS = {
  workout: 'habit-workout',
  read: 'habit-read',
  water: 'habit-water',
  noSugar: 'habit-nosugar',
} as const;

// ---------------------------------------------------------------------------
// Seed habits
// ---------------------------------------------------------------------------

const seedHabits: Habit[] = [
  {
    id: HABIT_IDS.workout,
    name: 'Morning Workout',
    icon: 'flame',
    color: '#FF6B6B',
    frequency: 'daily',
    reminderTime: '06:00',
    graceDay: false,
    archived: false,
    createdAt: subDays(new Date(), 20).toISOString(),
  },
  {
    id: HABIT_IDS.read,
    name: 'Read 30 Min',
    icon: 'book',
    color: '#60A5FA',
    frequency: 'daily',
    reminderTime: '21:00',
    graceDay: true,
    archived: false,
    createdAt: subDays(new Date(), 14).toISOString(),
  },
  {
    id: HABIT_IDS.water,
    name: 'Drink Water',
    icon: 'water-outline',
    color: '#38BDF8',
    frequency: 'daily',
    reminderTime: '08:00',
    graceDay: false,
    archived: false,
    createdAt: subDays(new Date(), 10).toISOString(),
  },
  {
    id: HABIT_IDS.noSugar,
    name: 'No Sugar',
    icon: 'nutrition',
    color: '#4ADE80',
    frequency: 'daily',
    graceDay: true,
    archived: false,
    createdAt: subDays(new Date(), 5).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Seed habit logs
//
//  • Morning Workout  → 14 consecutive days including today  (streak = 14)
//  • Read 30 Min      →  7 consecutive days including today  (streak =  7)
//  • Drink Water      →  5 consecutive days including today  (streak =  5)
//  • No Sugar         →  3 consecutive days including today  (streak =  3)
// ---------------------------------------------------------------------------

function buildSeedLogs(): HabitLog[] {
  const logs: HabitLog[] = [];

  function addRange(habitId: string, daysBack: number) {
    for (let i = daysBack; i >= 0; i--) {
      logs.push({ id: genId(), habitId, completedAt: dateStr(i) });
    }
  }

  addRange(HABIT_IDS.workout, 13); // days 13 … 0 = 14 days
  addRange(HABIT_IDS.read, 6);     // days  6 … 0 =  7 days
  addRange(HABIT_IDS.water, 4);    // days  4 … 0 =  5 days
  addRange(HABIT_IDS.noSugar, 2);  // days  2 … 0 =  3 days

  return logs;
}

const seedHabitLogs: HabitLog[] = buildSeedLogs();

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: seedHabits,
      habitLogs: seedHabitLogs,

      // -----------------------------------------------------------------------
      // Habit CRUD
      // -----------------------------------------------------------------------
      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: genId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archived: true } : h
          ),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          habitLogs: state.habitLogs.filter((l) => l.habitId !== id),
        }));
      },

      // -----------------------------------------------------------------------
      // Logging
      // -----------------------------------------------------------------------
      toggleHabitLog: (habitId, date) => {
        const { habitLogs } = get();
        const existing = habitLogs.find(
          (l) => l.habitId === habitId && l.completedAt === date
        );
        if (existing) {
          set((state) => ({
            habitLogs: state.habitLogs.filter((l) => l.id !== existing.id),
          }));
        } else {
          const newLog: HabitLog = { id: genId(), habitId, completedAt: date };
          set((state) => ({ habitLogs: [...state.habitLogs, newLog] }));
        }
      },

      // -----------------------------------------------------------------------
      // Simple predicate
      // -----------------------------------------------------------------------
      isHabitCompleted: (habitId, date) => {
        return get().habitLogs.some(
          (l) => l.habitId === habitId && l.completedAt === date
        );
      },

      // -----------------------------------------------------------------------
      // Streak: consecutive scheduled days completed, counting backwards from today.
      // Non-scheduled days are transparent (do not break the streak).
      // -----------------------------------------------------------------------
      getCurrentStreak: (habitId) => {
        const { habitLogs, habits } = get();
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return 0;

        const completed = new Set(
          habitLogs
            .filter((l) => l.habitId === habitId)
            .map((l) => l.completedAt)
        );

        let streak = 0;

        for (let i = 0; i <= 365; i++) {
          const d = dateStr(i);
          if (!isScheduledForDate(habit, d)) continue; // skip non-scheduled days
          if (completed.has(d)) {
            streak++;
          } else {
            break; // first missed scheduled day ends the streak
          }
        }

        return streak;
      },

      // -----------------------------------------------------------------------
      // Longest streak ever: scan all days from habit creation to today.
      // -----------------------------------------------------------------------
      getLongestStreak: (habitId) => {
        const { habitLogs, habits } = get();
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return 0;

        const completed = new Set(
          habitLogs
            .filter((l) => l.habitId === habitId)
            .map((l) => l.completedAt)
        );
        if (completed.size === 0) return 0;

        // Determine how many days to scan from creation to today
        const createdAt = parseISO(habit.createdAt);
        const totalDays =
          Math.ceil(
            (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;

        let longest = 0;
        let current = 0;

        // Scan oldest → newest (high daysAgo → 0)
        for (let i = totalDays - 1; i >= 0; i--) {
          const d = dateStr(i);
          if (!isScheduledForDate(habit, d)) continue;
          if (completed.has(d)) {
            current++;
            if (current > longest) longest = current;
          } else {
            current = 0;
          }
        }

        return longest;
      },

      // -----------------------------------------------------------------------
      // Completion rate: proportion of scheduled days completed in the last N days.
      // Returns a value between 0 and 1.
      // -----------------------------------------------------------------------
      getCompletionRate: (habitId, days) => {
        const { habitLogs, habits } = get();
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return 0;

        const completed = new Set(
          habitLogs
            .filter((l) => l.habitId === habitId)
            .map((l) => l.completedAt)
        );

        let scheduled = 0;
        let done = 0;

        for (let i = 0; i < days; i++) {
          const d = dateStr(i);
          if (!isScheduledForDate(habit, d)) continue;
          scheduled++;
          if (completed.has(d)) done++;
        }

        return scheduled === 0 ? 0 : done / scheduled;
      },

      // -----------------------------------------------------------------------
      // Month log: returns YYYY-MM-DD strings for completed days in a month.
      // month is 1-indexed (January = 1).
      // -----------------------------------------------------------------------
      getHabitLogsForMonth: (habitId, year, month) => {
        const { habitLogs } = get();
        return habitLogs
          .filter((l) => {
            if (l.habitId !== habitId) return false;
            const d = parseISO(l.completedAt);
            return getYear(d) === year && getMonth(d) + 1 === month;
          })
          .map((l) => l.completedAt);
      },

      // -----------------------------------------------------------------------
      // Today's active habits (non-archived and scheduled for today)
      // -----------------------------------------------------------------------
      getTodayHabits: () => {
        const { habits } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        return habits.filter(
          (h) => !h.archived && isScheduledForDate(h, today)
        );
      },

      // -----------------------------------------------------------------------
      // All done today?
      // -----------------------------------------------------------------------
      areAllTodayHabitsDone: () => {
        const { getTodayHabits, isHabitCompleted } = get();
        const todayHabits = getTodayHabits();
        if (todayHabits.length === 0) return false;
        const today = format(new Date(), 'yyyy-MM-dd');
        return todayHabits.every((h) => isHabitCompleted(h.id, today));
      },
    }),
    {
      name: 'clutch-habits-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
