// src/services/notificationService.ts

import { Platform } from 'react-native';

import { colors } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DAILY_REMINDER_STORAGE_KEY = 'lociland.dailyReminderNotificationId';
const DAILY_REMINDER_HOUR_STORAGE_KEY = 'lociland.dailyReminderHour';
const DAILY_REMINDER_MINUTE_STORAGE_KEY = 'lociland.dailyReminderMinute';

const DEFAULT_REMINDER_HOUR = 18;
const DEFAULT_REMINDER_MINUTE = 0;
const DAILY_REMINDER_CHANNEL_ID = 'daily-memory-reminders';

type ExpoNotificationsModule = typeof import('expo-notifications');

export interface DailyReminderSchedule {
  hour: number;
  minute: number;
}

export interface NotificationSetupResult {
  scheduled: boolean;
  notificationId: string | null;
  skippedReason?: string;
}

const isExpoGoAndroid = (): boolean => {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
};

const getExpoGoAndroidUnsupportedReason = (): string | null => {
  if (!isExpoGoAndroid()) {
    return null;
  }

  return 'expo-notifications is skipped in Expo Go on Android because push notification support was removed from Expo Go in SDK 53. Use a development build or production build to test notification scheduling.';
};

const clampHour = (hour: number): number => {
  if (!Number.isFinite(hour)) {
    return DEFAULT_REMINDER_HOUR;
  }

  return Math.min(23, Math.max(0, Math.floor(hour)));
};

const clampMinute = (minute: number): number => {
  if (!Number.isFinite(minute)) {
    return DEFAULT_REMINDER_MINUTE;
  }

  return Math.min(59, Math.max(0, Math.floor(minute)));
};

let cachedNotificationsModule: ExpoNotificationsModule | null = null;
let handlerConfigured = false;

const getNotificationsModule =
  async (): Promise<ExpoNotificationsModule | null> => {
    const unsupportedReason = getExpoGoAndroidUnsupportedReason();

    if (unsupportedReason) {
      console.info(unsupportedReason);
      return null;
    }

    if (cachedNotificationsModule) {
      return cachedNotificationsModule;
    }

    const notifications = await import('expo-notifications');

    cachedNotificationsModule = notifications;

    if (!handlerConfigured) {
      notifications.setNotificationHandler({
        handleNotification: async () =>
          ({
            shouldPlaySound: true,
            shouldSetBadge: false,

            // SDK 53+ fields
            shouldShowBanner: true,
            shouldShowList: true,

            // Older SDK compatibility field. Kept intentionally.
            shouldShowAlert: true,
          }) as any,
      });

      handlerConfigured = true;
    }

    return notifications;
  };

const ensureAndroidNotificationChannel = async (
  notifications: ExpoNotificationsModule,
): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifications.setNotificationChannelAsync(
    DAILY_REMINDER_CHANNEL_ID,
    {
      name: 'Daily memory reminders',
      importance: notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.primary,
    },
  );
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const notifications = await getNotificationsModule();

  if (!notifications) {
    return false;
  }

  await ensureAndroidNotificationChannel(notifications);

  const existingPermission = await notifications.getPermissionsAsync();

  if (existingPermission.granted) {
    return true;
  }

  const requestedPermission = await notifications.requestPermissionsAsync();

  return requestedPermission.granted;
};

export const getStoredDailyReminderTime =
  async (): Promise<DailyReminderSchedule> => {
    const [storedHour, storedMinute] = await Promise.all([
      AsyncStorage.getItem(DAILY_REMINDER_HOUR_STORAGE_KEY),
      AsyncStorage.getItem(DAILY_REMINDER_MINUTE_STORAGE_KEY),
    ]);

    return {
      hour: clampHour(
        storedHour === null ? DEFAULT_REMINDER_HOUR : Number(storedHour),
      ),
      minute: clampMinute(
        storedMinute === null
          ? DEFAULT_REMINDER_MINUTE
          : Number(storedMinute),
      ),
    };
  };

export const scheduleDailyMemoryReminder = async ({
  hour,
  minute,
}: DailyReminderSchedule): Promise<NotificationSetupResult> => {
  const unsupportedReason = getExpoGoAndroidUnsupportedReason();

  if (unsupportedReason) {
    return {
      scheduled: false,
      notificationId: null,
      skippedReason: unsupportedReason,
    };
  }

  const notifications = await getNotificationsModule();

  if (!notifications) {
    return {
      scheduled: false,
      notificationId: null,
      skippedReason: 'expo-notifications module is not available.',
    };
  }

  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return {
      scheduled: false,
      notificationId: null,
      skippedReason: 'Notification permission was not granted.',
    };
  }

  const safeHour = clampHour(hour);
  const safeMinute = clampMinute(minute);

  const existingNotificationId = await AsyncStorage.getItem(
    DAILY_REMINDER_STORAGE_KEY,
  );

  if (existingNotificationId) {
    await notifications.cancelScheduledNotificationAsync(
      existingNotificationId,
    );
  }

  const notificationId = await notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to visit your palaces! 🏛️',
      body: 'Keep your streak alive!',
      sound: 'default',
      data: {
        screen: 'Home',
        source: 'daily_memory_reminder',
      },
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.DAILY,
      hour: safeHour,
      minute: safeMinute,
      channelId: DAILY_REMINDER_CHANNEL_ID,
    },
  });

  await Promise.all([
    AsyncStorage.setItem(DAILY_REMINDER_STORAGE_KEY, notificationId),
    AsyncStorage.setItem(DAILY_REMINDER_HOUR_STORAGE_KEY, String(safeHour)),
    AsyncStorage.setItem(DAILY_REMINDER_MINUTE_STORAGE_KEY, String(safeMinute)),
  ]);

  return {
    scheduled: true,
    notificationId,
  };
};

export const ensureDefaultDailyMemoryReminder =
  async (): Promise<NotificationSetupResult> => {
    const storedTime = await getStoredDailyReminderTime();

    return scheduleDailyMemoryReminder(storedTime);
  };

export const cancelDailyMemoryReminder = async (): Promise<void> => {
  const unsupportedReason = getExpoGoAndroidUnsupportedReason();

  if (unsupportedReason) {
    return;
  }

  const notifications = await getNotificationsModule();

  if (!notifications) {
    return;
  }

  const existingNotificationId = await AsyncStorage.getItem(
    DAILY_REMINDER_STORAGE_KEY,
  );

  if (existingNotificationId) {
    await notifications.cancelScheduledNotificationAsync(existingNotificationId);
  }

  await AsyncStorage.removeItem(DAILY_REMINDER_STORAGE_KEY);
};