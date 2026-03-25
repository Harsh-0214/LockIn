/**
 * db/queries.ts
 *
 * Thin wrapper around expo-sqlite for Clutch.
 * All heavy lifting is done by Zustand stores (with AsyncStorage persistence).
 * This module exists so the root layout can call `initDatabase()` on startup
 * for any future SQLite migrations or pre-warming.
 */

// ---------------------------------------------------------------------------
// initDatabase
// ---------------------------------------------------------------------------

/**
 * Called once at app startup (from app/_layout.tsx).
 * Currently a no-op placeholder — the app relies entirely on Zustand +
 * AsyncStorage for persistence. Add SQLite migrations here when needed.
 */
export async function initDatabase(): Promise<void> {
  // No-op: Zustand handles all persistence via AsyncStorage.
  // Future: open expo-sqlite DB, run migrations, seed tables.
  return Promise.resolve();
}
