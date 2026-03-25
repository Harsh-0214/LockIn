import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Syne_700Bold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from '@/db/queries';
import { useUserStore } from '@/store/useUserStore';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);

  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  // Initialize database on mount
  useEffect(() => {
    initDatabase().catch((err) =>
      console.warn('[Clutch] initDatabase error:', err)
    );
  }, []);

  // Check AsyncStorage for onboarding key
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem('onboardingComplete');
        if (value !== 'true' && !onboardingComplete) {
          router.replace('/onboarding' as any);
        }
      } catch (_) {
        // If AsyncStorage fails, let the store value decide
        if (!onboardingComplete) {
          router.replace('/onboarding' as any);
        }
      } finally {
        setOnboardingChecked(true);
      }
    }
    checkOnboarding();
  }, []);

  if (!fontsLoaded || !onboardingChecked) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="note-editor" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
