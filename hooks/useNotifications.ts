import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { CalendarEvent } from '../store/useCalendarStore';

// ---------------------------------------------------------------------------
// Configure how notifications are handled when the app is foregrounded
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseNotificationsReturn {
  /** Whether the user has granted notification permissions. */
  hasPermission: boolean;
  /** Explicitly ask the user for notification permission. Returns the result. */
  requestPermission: () => Promise<boolean>;
  /**
   * Schedule a local notification for a CalendarEvent.
   * The notification fires `event.alertOffset` minutes before `event.startTime`.
   * Returns the notification identifier, or null if permission is denied or
   * no alertOffset is set.
   */
  scheduleEventNotification: (event: CalendarEvent) => Promise<string | null>;
  /** Cancel a previously scheduled notification by its identifier. */
  cancelNotification: (notificationId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications(): UseNotificationsReturn {
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // Check existing permission status on mount (do not prompt yet)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch {
        setHasPermission(false);
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // requestPermission
  // -------------------------------------------------------------------------
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // On Android 13+ we need to explicitly request POST_NOTIFICATIONS.
      // expo-notifications handles this via requestPermissionsAsync.
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      const granted = status === 'granted';
      setHasPermission(granted);

      // Android requires a notification channel
      if (granted && Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('clutch-default', {
          name: 'Clutch Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      return granted;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, []);

  // -------------------------------------------------------------------------
  // scheduleEventNotification
  // -------------------------------------------------------------------------
  const scheduleEventNotification = useCallback(
    async (event: CalendarEvent): Promise<string | null> => {
      // Guard: need permission
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      // Guard: need an alertOffset
      if (event.alertOffset === undefined || event.alertOffset === null) {
        return null;
      }

      const startMs = new Date(event.startTime).getTime();
      const triggerMs = startMs - event.alertOffset * 60 * 1000;
      const now = Date.now();

      // Don't schedule notifications in the past
      if (triggerMs <= now) return null;

      try {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: event.title,
            body:
              event.alertOffset === 0
                ? 'Your event is starting now.'
                : `Starting in ${event.alertOffset} minute${event.alertOffset !== 1 ? 's' : ''}.`,
            data: { eventId: event.id },
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(triggerMs),
          },
        });
        return identifier;
      } catch {
        return null;
      }
    },
    [hasPermission, requestPermission]
  );

  // -------------------------------------------------------------------------
  // cancelNotification
  // -------------------------------------------------------------------------
  const cancelNotification = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch {
        // Silently fail — the notification may have already fired or been removed
      }
    },
    []
  );

  return {
    hasPermission,
    requestPermission,
    scheduleEventNotification,
    cancelNotification,
  };
}
