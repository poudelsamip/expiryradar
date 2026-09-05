export const CATEGORY_KEYS = [
  'documents',
  'food',
  'returns',
  'warranties',
  'subscriptions',
  'insurance',
  'finance',
  'vehicle',
  'other',
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const ITEM_STATUSES = ['expired', 'critical', 'soon', 'upcoming', 'later'] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type Item = {
  id: string;
  user_id: string | null;
  name: string;
  category: CategoryKey;
  key_date: string; // ISO date, e.g. "2026-09-05"
  notes: string | null;
  quantity: number | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type Reminder = {
  id: string;
  item_id: string;
  offset_days: number;
  notification_id: string | null;
};

export type Attachment = {
  id: string;
  item_id: string;
  // Signed-in users: the storage object path (e.g. "<user_id>/<item_id>/<file>"),
  // resolved to a short-lived signed URL at display time. Guests: a local
  // file:// URI, since guest attachments never leave the device.
  file_url: string;
  file_type: 'image' | 'pdf';
  created_at: string;
};

export type NewItemInput = {
  name: string;
  category: CategoryKey;
  key_date: string;
  notes?: string | null;
  quantity?: number | null;
  reminderOffsets?: number[];
};
