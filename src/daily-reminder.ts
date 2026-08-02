import { Capacitor, type PermissionState } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { AppLanguage } from './game/types';
import type { PlatformEventPayload } from './platform';

type ReminderTracker = (event: string, payload?: PlatformEventPayload) => void;

const dailyReminderId = 20_000_001;
const dailyReminderHour = 20;
const dailyReminderMinute = 0;
const dailyReminderSecond = 0;

const REMINDER_COPY: Record<AppLanguage, { title: string; body: string }> = {
  zh: {
    title: '箭了又箭',
    body: '今晚也来清几关吧，看看你能走到第几关。'
  },
  en: {
    title: 'Arrow Again',
    body: 'A few arrows are waiting. Come clear another level tonight.'
  }
};

let actionListenerRegistered = false;

export async function configureAndroidDailyReminder(language: AppLanguage, track: ReminderTracker): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    await registerActionListener(track);
  } catch (error) {
    trackReminderError(track, 'listener', error);
  }

  try {
    let permission = await LocalNotifications.checkPermissions();
    trackPermission(track, permission.display, 'check');

    if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
      permission = await LocalNotifications.requestPermissions();
      trackPermission(track, permission.display, 'request');
    }

    if (permission.display !== 'granted') {
      return;
    }

    const pending = await LocalNotifications.getPending();
    const existingReminder = pending.notifications.find((notification) => notification.id === dailyReminderId);
    const copy = REMINDER_COPY[language];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'device_local';

    if (
      existingReminder?.schedule?.on?.hour === dailyReminderHour &&
      existingReminder.schedule.on.minute === dailyReminderMinute &&
      existingReminder.schedule.on.second === dailyReminderSecond &&
      existingReminder.title === copy.title &&
      existingReminder.body === copy.body &&
      existingReminder.extra?.timeZone === timeZone
    ) {
      track('daily_reminder_scheduled', reminderSchedulePayload('already_scheduled', timeZone));
      return;
    }

    if (existingReminder) {
      await LocalNotifications.cancel({ notifications: [{ id: dailyReminderId }] });
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: dailyReminderId,
          title: copy.title,
          body: copy.body,
          schedule: {
            on: {
              hour: dailyReminderHour,
              minute: dailyReminderMinute,
              second: dailyReminderSecond
            },
            allowWhileIdle: true
          },
          autoCancel: true,
          extra: {
            source: 'daily_reminder',
            timeZone
          }
        }
      ]
    });

    track('daily_reminder_scheduled', reminderSchedulePayload(existingReminder ? 'updated' : 'created', timeZone));
  } catch (error) {
    trackReminderError(track, 'configure', error);
  }
}

async function registerActionListener(track: ReminderTracker): Promise<void> {
  if (actionListenerRegistered) {
    return;
  }

  await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    if (action.notification.id !== dailyReminderId) {
      return;
    }

    track('daily_reminder_open', {
      action_id: action.actionId,
      notification_id: dailyReminderId,
      schedule_hour: dailyReminderHour,
      time_basis: 'device_local'
    });
  });
  actionListenerRegistered = true;
}

function trackPermission(track: ReminderTracker, permission: PermissionState, source: 'check' | 'request'): void {
  track('daily_reminder_permission', {
    permission,
    source
  });
}

function reminderSchedulePayload(
  status: 'created' | 'updated' | 'already_scheduled',
  timeZone: string
): PlatformEventPayload {
  return {
    notification_id: dailyReminderId,
    schedule_hour: dailyReminderHour,
    schedule_minute: dailyReminderMinute,
    schedule_second: dailyReminderSecond,
    time_basis: 'device_local',
    time_zone: timeZone,
    status
  };
}

function trackReminderError(track: ReminderTracker, stage: 'listener' | 'configure', error: unknown): void {
  track('daily_reminder_error', {
    stage,
    error_name: error instanceof Error ? error.name : 'unknown'
  });
  console.warn(`Daily reminder ${stage} failed`, error);
}
