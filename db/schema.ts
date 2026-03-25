import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const weightEntries = sqliteTable('weight_entries', {
  id: text('id').primaryKey(),
  weight: real('weight').notNull(),
  unit: text('unit').notNull(),
  loggedAt: text('logged_at').notNull(),
});

export const mealLogs = sqliteTable('meal_logs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  calories: integer('calories').notNull(),
  protein: real('protein'),
  carbs: real('carbs'),
  fat: real('fat'),
  loggedAt: text('logged_at').notNull(),
});

export const workoutSessions = sqliteTable('workout_sessions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  notes: text('notes'),
  loggedAt: text('logged_at').notNull(),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title'),
  content: text('content').notNull(),
  notebookId: text('notebook_id'),
  pinned: integer('pinned').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const notebooks = sqliteTable('notebooks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
});

export const calendarEvents = sqliteTable('calendar_events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  category: text('category').notNull(),
  repeat: text('repeat').default('none'),
  alertOffset: integer('alert_offset'),
  notes: text('notes'),
  notificationId: text('notification_id'),
});

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  frequency: text('frequency').notNull(),
  reminderTime: text('reminder_time'),
  graceDay: integer('grace_day').default(0),
  archived: integer('archived').default(0),
  createdAt: text('created_at').notNull(),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull(),
  completedAt: text('completed_at').notNull(),
});

export const waterLogs = sqliteTable('water_logs', {
  id: text('id').primaryKey(),
  glasses: integer('glasses').notNull(),
  loggedAt: text('logged_at').notNull(),
});
