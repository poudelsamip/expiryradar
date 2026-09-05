import { create } from 'zustand';

import type { PermissionState } from '@/lib/notifications';

type NotificationsState = {
  permission: PermissionState;
  setPermission: (permission: PermissionState) => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  permission: 'undetermined',
  setPermission: (permission) => set({ permission }),
}));
