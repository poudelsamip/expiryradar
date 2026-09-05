import type { Ionicons } from '@expo/vector-icons';

import type { CategoryKey } from '@/types/item';

type CategoryConfig = {
  key: CategoryKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  defaultReminderOffsets: number[];
  actionLabel: string; // label for the primary "resolve" action on item detail
  usesQuantity: boolean;
};

export const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  documents: {
    key: 'documents',
    label: 'Documents',
    icon: 'document-text',
    color: '#2563eb',
    defaultReminderOffsets: [90, 30, 7],
    actionLabel: 'Renew',
    usesQuantity: false,
  },
  food: {
    key: 'food',
    label: 'Food',
    icon: 'fast-food',
    color: '#16a34a',
    defaultReminderOffsets: [1],
    actionLabel: 'Mark used',
    usesQuantity: true,
  },
  returns: {
    key: 'returns',
    label: 'Returns & refunds',
    icon: 'return-up-back',
    color: '#f59e0b',
    defaultReminderOffsets: [3, 1],
    actionLabel: 'Mark returned',
    usesQuantity: false,
  },
  warranties: {
    key: 'warranties',
    label: 'Warranties',
    icon: 'shield-checkmark',
    color: '#7c3aed',
    defaultReminderOffsets: [30, 7],
    actionLabel: 'Renew',
    usesQuantity: false,
  },
  subscriptions: {
    key: 'subscriptions',
    label: 'Subscriptions',
    icon: 'card',
    color: '#0891b2',
    defaultReminderOffsets: [7, 1],
    actionLabel: 'Renew',
    usesQuantity: false,
  },
  insurance: {
    key: 'insurance',
    label: 'Insurance',
    icon: 'umbrella',
    color: '#0284c7',
    defaultReminderOffsets: [30, 7],
    actionLabel: 'Renew',
    usesQuantity: false,
  },
  finance: {
    key: 'finance',
    label: 'Finance',
    icon: 'wallet',
    color: '#db2777',
    defaultReminderOffsets: [30, 7],
    actionLabel: 'Renew',
    usesQuantity: false,
  },
  vehicle: {
    key: 'vehicle',
    label: 'Vehicle',
    icon: 'car-sport',
    color: '#ea580c',
    defaultReminderOffsets: [30, 7],
    actionLabel: 'Renew',
    usesQuantity: false,
  },
  other: {
    key: 'other',
    label: 'Other',
    icon: 'ellipsis-horizontal-circle',
    color: '#64748b',
    defaultReminderOffsets: [7],
    actionLabel: 'Mark done',
    usesQuantity: false,
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

// Categories shown in the Home dashboard's "Expiring soon" section.
export const EXPIRING_SOON_CATEGORIES: CategoryKey[] = [
  'documents',
  'warranties',
  'subscriptions',
  'insurance',
  'finance',
  'vehicle',
  'other',
];
