import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Runs once on first launch (guarded by the 'seedDataLoaded' AsyncStorage key).
 *
 * All mock/seed data is defined directly in the Zustand store initial states,
 * so this function simply sets the flag the first time it is called so that
 * subsequent app launches skip the seeding step entirely.
 */
export async function loadSeedDataIfNeeded(): Promise<void> {
  try {
    const loaded = await AsyncStorage.getItem('seedDataLoaded');
    if (loaded === 'true') return;

    // The stores are already initialized with mock data in their initial state.
    // No additional data manipulation is required here.

    await AsyncStorage.setItem('seedDataLoaded', 'true');
  } catch (err) {
    // Silently swallow storage errors — the app is still usable without seed data.
    console.warn('[Clutch] loadSeedDataIfNeeded error:', err);
  }
}
