/**
 * db/schema.ts
 *
 * Type definitions for Clutch's data models.
 * Data is persisted via Zustand + AsyncStorage (see store/).
 */

export interface WeightEntry {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  loggedAt: string;
}

export interface MealLog {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  loggedAt: string;
}

export interface WorkoutSession {
  id: string;
  type: string;
  durationMinutes: number;
  notes?: string;
  loggedAt: string;
}

export interface Note {
  id: string;
  title?: string;
  content: string;
  notebookId?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  repeat: string;
  alertOffset?: number;
  notes?: string;
  notificationId?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  reminderTime?: string;
  graceDay: boolean;
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedAt: string;
}

export interface WaterLog {
  id: string;
  glasses: number;
  loggedAt: string;
}
