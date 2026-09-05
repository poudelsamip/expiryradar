import type { ItemStatus } from '@/types/item';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Whole days between today and key_date. Negative when key_date is in the past.
export function daysUntil(keyDate: string, today: Date = new Date()): number {
  const target = startOfDay(new Date(keyDate));
  const from = startOfDay(today);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - from.getTime()) / msPerDay);
}

export function computeStatus(keyDate: string, today: Date = new Date()): ItemStatus {
  const days = daysUntil(keyDate, today);
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'soon';
  if (days <= 30) return 'upcoming';
  return 'later';
}

export const STATUS_COLORS: Record<ItemStatus, string> = {
  expired: '#ef4444',
  critical: '#f97316',
  soon: '#f59e0b',
  upcoming: '#3b82f6',
  later: '#94a3b8',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  expired: 'Expired',
  critical: 'Critical',
  soon: 'Due soon',
  upcoming: 'Upcoming',
  later: 'Later',
};

export function formatDaysLabel(keyDate: string, today: Date = new Date()): string {
  const days = daysUntil(keyDate, today);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `${days}d left`;
}
