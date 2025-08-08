export type ReminderPayload = {
  id: string;
  title: string;
  message: string;
  when: number; // epoch ms
};

const STORAGE_KEY = 'scheduled_reminders_v1';

function loadReminders(): ReminderPayload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReminderPayload[]) : [];
  } catch {
    return [];
  }
}

function saveReminders(reminders: ReminderPayload[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

export function scheduleReminder(reminder: ReminderPayload) {
  const reminders = loadReminders();
  reminders.push(reminder);
  saveReminders(reminders);
}

export function cancelReminder(id: string) {
  const reminders = loadReminders().filter((r) => r.id !== id);
  saveReminders(reminders);
}

let intervalId: number | null = null;

export function startReminderLoop() {
  if (intervalId) return;
  intervalId = window.setInterval(async () => {
    const now = Date.now();
    const reminders = loadReminders();
    const due = reminders.filter((r) => r.when <= now);
    const upcoming = reminders.filter((r) => r.when > now);
    if (due.length > 0) {
      const permitted = await requestNotificationPermission();
      if (permitted) {
        due.forEach((r) => {
          new Notification(r.title, { body: r.message });
        });
      }
      saveReminders(upcoming);
    }
  }, 30 * 1000);
}

export function stopReminderLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.error('Service worker registration failed', e);
    }
  }
}

