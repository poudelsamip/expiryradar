import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import type { Item, Reminder } from '@/types/item';

type NotificationsModule = typeof import('expo-notifications');

// expo-notifications' entry point imports DevicePushTokenAutoRegistration.fx,
// which registers a push-token listener at module scope. On Android in Expo Go
// that path throws (remote notifications were removed from Expo Go in SDK 53),
// so importing the package at all crashes the app on launch. Reminders need a
// development build; in Expo Go we degrade to a no-op so the rest of the app
// still runs.
export const notificationsSupported = !(isRunningInExpoGo() && Platform.OS === 'android');

let cachedModule: NotificationsModule | null = null;

function getNotificationsModule(): NotificationsModule | null {
  if (!notificationsSupported) return null;
  if (!cachedModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications') as NotificationsModule;
    cachedModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return cachedModule;
}

const REMINDER_HOUR = 9; // local time each reminder fires at

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getNotificationPermission(): Promise<PermissionState> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return 'unsupported';
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionState;
}

export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function triggerDateFor(keyDate: string, offsetDays: number): Date {
  const [y, m, d] = keyDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - offsetDays);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
}

async function scheduleOne(item: Item, offsetDays: number): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  const triggerDate = triggerDateFor(item.key_date, offsetDays);
  if (triggerDate.getTime() <= Date.now()) return null;

  const category = CATEGORIES[item.category];
  const body =
    offsetDays === 0
      ? `${item.name} is due today.`
      : `${item.name} is due in ${offsetDays} day${offsetDays === 1 ? '' : 's'}.`;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `${category.label}: ${item.name}`,
        body,
        data: { itemId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch {
    // Local scheduling isn't available on this platform (e.g. web) — the
    // item is still saved, it just won't get an on-device reminder.
    return null;
  }
}

export async function cancelNotification(notificationId: string | null | undefined): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
}

export async function cancelReminders(reminders: Reminder[]): Promise<void> {
  await Promise.all(reminders.map((r) => cancelNotification(r.notification_id)));
}

// Cancels any existing notifications for these reminders and schedules fresh
// ones against the item's current key_date. Must be called whenever key_date
// changes so a reminder never fires against a stale date.
export async function rescheduleReminders(item: Item, reminders: Reminder[]): Promise<Reminder[]> {
  await cancelReminders(reminders);

  const permission = await getNotificationPermission();
  if (permission !== 'granted') {
    return reminders.map((r) => ({ ...r, notification_id: null }));
  }

  return Promise.all(
    reminders.map(async (r) => ({
      ...r,
      notification_id: await scheduleOne(item, r.offset_days),
    }))
  );
}
