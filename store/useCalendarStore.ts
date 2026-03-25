import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, getYear, getMonth, addDays } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  category: 'Work' | 'Health' | 'Personal' | 'Other';
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  alertOffset?: number; // minutes before event
  notes?: string;
  notificationId?: string;
}

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string; // YYYY-MM-DD

  addEvent: (event: Omit<CalendarEvent, 'id'>) => string;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Build an ISO date-time string for the given YYYY-MM-DD date at HH:MM.
 * e.g. makeISO('2026-03-25', 9, 30) → '2026-03-25T09:30:00.000Z' (local)
 */
function makeISO(dateStr: string, hour: number, minute = 0): string {
  const d = new Date(dateStr);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// Today and nearby dates (anchored to 2026-03-25)
const TODAY = '2026-03-25';
const tomorrow = format(addDays(new Date(TODAY), 1), 'yyyy-MM-dd');
const dayAfter = format(addDays(new Date(TODAY), 2), 'yyyy-MM-dd');
const inThreeDays = format(addDays(new Date(TODAY), 3), 'yyyy-MM-dd');
const yesterday = format(addDays(new Date(TODAY), -1), 'yyyy-MM-dd');

// ---------------------------------------------------------------------------
// Seed events — 5 realistic events mixed across today and this week
// ---------------------------------------------------------------------------

const seedEvents: CalendarEvent[] = [
  // ── 1. Work: Team standup — today ────────────────────────────────────────
  {
    id: genId(),
    title: 'Team Standup',
    startTime: makeISO(TODAY, 9, 30),
    endTime: makeISO(TODAY, 10, 0),
    category: 'Work',
    repeat: 'daily',
    alertOffset: 5,
    notes: 'Share progress on the Clutch beta release. Mention the notification system PR.',
  },

  // ── 2. Health: Gym session — today ───────────────────────────────────────
  {
    id: genId(),
    title: 'Gym Session',
    startTime: makeISO(TODAY, 6, 30),
    endTime: makeISO(TODAY, 7, 30),
    category: 'Health',
    repeat: 'weekly',
    alertOffset: 15,
    notes: 'Pull day — deadlifts, rows, pull-ups. Target: 4 working sets each.',
  },

  // ── 3. Personal: Dinner with family — tomorrow ───────────────────────────
  {
    id: genId(),
    title: 'Dinner with Family',
    startTime: makeISO(tomorrow, 19, 0),
    endTime: makeISO(tomorrow, 21, 30),
    category: 'Personal',
    repeat: 'none',
    alertOffset: 60,
    notes: 'Book a table at La Piazza — call ahead, it gets busy on Thursdays.',
  },

  // ── 4. Work: Product review — day after tomorrow ─────────────────────────
  {
    id: genId(),
    title: 'Product Review — Q2 Roadmap',
    startTime: makeISO(dayAfter, 14, 0),
    endTime: makeISO(dayAfter, 15, 30),
    category: 'Work',
    repeat: 'none',
    alertOffset: 30,
    notes: 'Prepare slides on habit tracker UX and onboarding funnel metrics.',
  },

  // ── 5. Personal: Weekend run — 3 days from now ────────────────────────────
  {
    id: genId(),
    title: 'Morning Run — 5 km',
    startTime: makeISO(inThreeDays, 7, 0),
    endTime: makeISO(inThreeDays, 7, 45),
    category: 'Health',
    repeat: 'weekly',
    alertOffset: 10,
    notes: 'Target pace: sub-6 min/km. Bring water, route via the park.',
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: seedEvents,
      selectedDate: TODAY,

      // -----------------------------------------------------------------------
      // CRUD
      // -----------------------------------------------------------------------
      addEvent: (event) => {
        const id = genId();
        const newEvent: CalendarEvent = { ...event, id };
        set((state) => ({ events: [...state.events, newEvent] }));
        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },

      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      // -----------------------------------------------------------------------
      // Selectors
      // -----------------------------------------------------------------------

      /**
       * Returns all events that fall on the given YYYY-MM-DD date.
       * Handles 'daily', 'weekly', and 'monthly' repeating events as well.
       */
      getEventsForDate: (date) => {
        const { events } = get();
        const target = new Date(date);
        // Normalise to midnight local time for day comparison
        target.setHours(0, 0, 0, 0);

        return events.filter((e) => {
          const start = new Date(e.startTime);
          start.setHours(0, 0, 0, 0);

          if (start.getTime() === target.getTime()) return true;

          if (e.repeat === 'none') return false;
          if (target < start) return false;

          if (e.repeat === 'daily') return true;

          if (e.repeat === 'weekly') {
            return start.getDay() === target.getDay();
          }

          if (e.repeat === 'monthly') {
            return start.getDate() === target.getDate();
          }

          return false;
        });
      },

      /**
       * Returns all events that have at least one occurrence within the given
       * calendar month (1-indexed month, e.g. March = 3).
       */
      getEventsForMonth: (year, month) => {
        const { events } = get();
        // month is 1-indexed; Date months are 0-indexed
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0); // last day of month

        return events.filter((e) => {
          const start = new Date(e.startTime);
          start.setHours(0, 0, 0, 0);

          if (e.repeat === 'none') {
            return (
              getYear(start) === year && getMonth(start) + 1 === month
            );
          }

          if (e.repeat === 'daily') {
            // Ongoing daily event started before or during this month
            return start <= monthEnd;
          }

          if (e.repeat === 'weekly') {
            return start <= monthEnd;
          }

          if (e.repeat === 'monthly') {
            return start <= monthEnd;
          }

          return false;
        });
      },
    }),
    {
      name: 'clutch-calendar-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
