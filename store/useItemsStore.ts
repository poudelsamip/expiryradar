import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { deleteAttachmentFile, isDisplayableUri, uploadAttachment } from '@/lib/attachments';
import { CATEGORIES } from '@/constants/categories';
import { cancelReminders, rescheduleReminders } from '@/lib/notifications';
import { generateId } from '@/lib/uuid';
import { supabase } from '@/lib/supabase';
import type { Attachment, Item, NewItemInput, Reminder } from '@/types/item';

const GUEST_ITEMS_KEY = 'expiry_radar_guest_items';
export const GUEST_ITEM_LIMIT = 5;

type GuestItem = Item & { reminders: Reminder[]; attachments: Attachment[] };

async function readGuestItems(): Promise<GuestItem[]> {
  const raw = await AsyncStorage.getItem(GUEST_ITEMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GuestItem[];
  } catch {
    return [];
  }
}

async function writeGuestItems(items: GuestItem[]): Promise<void> {
  await AsyncStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(items));
}

function offsetsFor(category: NewItemInput['category'], offsets?: number[]): number[] {
  return offsets ?? CATEGORIES[category].defaultReminderOffsets;
}

// Persists notification ids assigned by the notification engine back onto
// the reminder rows in Supabase (upsert by primary key).
async function persistNotificationIds(reminders: Reminder[]): Promise<void> {
  if (reminders.length === 0) return;
  await supabase.from('reminders').upsert(
    reminders.map((r) => ({
      id: r.id,
      item_id: r.item_id,
      offset_days: r.offset_days,
      notification_id: r.notification_id,
    }))
  );
}

async function deleteAttachmentsFromStorage(attachments: Attachment[]): Promise<void> {
  await Promise.all(
    attachments
      .filter((a) => !isDisplayableUri(a.file_url)) // only real storage paths, not local guest uris
      .map((a) => deleteAttachmentFile(a.file_url))
  );
}

type ItemsState = {
  items: Item[];
  remindersByItemId: Record<string, Reminder[]>;
  attachmentsByItemId: Record<string, Attachment[]>;
  isLoading: boolean;
  isGuest: boolean;
  guestItemCount: number;
  loadForUser: (userId: string | null) => Promise<void>;
  addItem: (
    input: NewItemInput,
    userId: string | null
  ) => Promise<{ error: string | null; id?: string }>;
  updateItem: (
    id: string,
    patch: Partial<NewItemInput>,
    userId: string | null
  ) => Promise<{ error: string | null }>;
  archiveItem: (id: string, userId: string | null) => Promise<void>;
  deleteItem: (id: string, userId: string | null) => Promise<void>;
  addAttachment: (
    itemId: string,
    localUri: string,
    userId: string | null
  ) => Promise<{ error: string | null }>;
  deleteAttachment: (
    attachmentId: string,
    itemId: string,
    userId: string | null
  ) => Promise<void>;
};

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  remindersByItemId: {},
  attachmentsByItemId: {},
  isLoading: false,
  isGuest: true,
  guestItemCount: 0,

  loadForUser: async (userId) => {
    set({ isLoading: true });

    if (!userId) {
      const guestItems = await readGuestItems();
      const remindersByItemId: Record<string, Reminder[]> = {};
      const attachmentsByItemId: Record<string, Attachment[]> = {};
      guestItems.forEach((it) => {
        remindersByItemId[it.id] = it.reminders;
        attachmentsByItemId[it.id] = it.attachments ?? [];
      });
      set({
        items: guestItems,
        remindersByItemId,
        attachmentsByItemId,
        isGuest: true,
        guestItemCount: guestItems.length,
        isLoading: false,
      });
      return;
    }

    // Migrate any guest items created before signup into the user's account.
    const guestItems = await readGuestItems();
    if (guestItems.length > 0) {
      for (const guestItem of guestItems) {
        const { id: _guestId, reminders: guestReminders, attachments: guestAttachments, ...rest } =
          guestItem;
        const { data: inserted, error: insertError } = await supabase
          .from('items')
          .insert({ ...rest, user_id: userId })
          .select()
          .single();
        if (!insertError && inserted) {
          const { data: insertedReminders } = await supabase
            .from('reminders')
            .insert(guestReminders.map((r) => ({ item_id: inserted.id, offset_days: r.offset_days })))
            .select();
          // The guest-mode notifications were scheduled against local ids;
          // cancel them and reschedule fresh ones tied to the new DB rows.
          await cancelReminders(guestReminders);
          const scheduled = await rescheduleReminders(inserted as Item, (insertedReminders ?? []) as Reminder[]);
          await persistNotificationIds(scheduled);

          for (const attachment of guestAttachments ?? []) {
            const { path } = await uploadAttachment(userId, inserted.id, attachment.file_url);
            if (path) {
              await supabase
                .from('attachments')
                .insert({ item_id: inserted.id, file_url: path, file_type: attachment.file_type });
            }
          }
        }
      }
      await AsyncStorage.removeItem(GUEST_ITEMS_KEY);
    }

    const { data, error } = await supabase
      .from('items')
      .select('*, reminders(*), attachments(*)')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('key_date', { ascending: true });

    if (error) {
      set({ isLoading: false, isGuest: false });
      return;
    }

    const items: Item[] = [];
    const remindersByItemId: Record<string, Reminder[]> = {};
    const attachmentsByItemId: Record<string, Attachment[]> = {};
    (data ?? []).forEach((row) => {
      const { reminders, attachments, ...item } = row as Item & {
        reminders: Reminder[];
        attachments: Attachment[];
      };
      items.push(item);
      remindersByItemId[item.id] = reminders ?? [];
      attachmentsByItemId[item.id] = attachments ?? [];
    });

    set({ items, remindersByItemId, attachmentsByItemId, isGuest: false, guestItemCount: 0, isLoading: false });
  },

  addItem: async (input, userId) => {
    const now = new Date().toISOString();
    const offsets = offsetsFor(input.category, input.reminderOffsets);

    if (!userId) {
      const guestItems = await readGuestItems();
      if (guestItems.length >= GUEST_ITEM_LIMIT) {
        return { error: `Guest mode is limited to ${GUEST_ITEM_LIMIT} items. Sign up to add more.` };
      }
      const id = generateId();
      const baseItem: Item = {
        id,
        user_id: null,
        name: input.name,
        category: input.category,
        key_date: input.key_date,
        notes: input.notes ?? null,
        quantity: input.quantity ?? null,
        created_at: now,
        updated_at: now,
        archived_at: null,
      };
      const draftReminders: Reminder[] = offsets.map((offset_days) => ({
        id: generateId(),
        item_id: id,
        offset_days,
        notification_id: null,
      }));
      const scheduledReminders = await rescheduleReminders(baseItem, draftReminders);
      const newItem: GuestItem = { ...baseItem, reminders: scheduledReminders, attachments: [] };

      const updated = [...guestItems, newItem];
      await writeGuestItems(updated);
      set((state) => ({
        items: [...state.items, newItem],
        remindersByItemId: { ...state.remindersByItemId, [id]: scheduledReminders },
        attachmentsByItemId: { ...state.attachmentsByItemId, [id]: [] },
        guestItemCount: updated.length,
      }));
      return { error: null, id };
    }

    const { data: inserted, error } = await supabase
      .from('items')
      .insert({
        user_id: userId,
        name: input.name,
        category: input.category,
        key_date: input.key_date,
        notes: input.notes ?? null,
        quantity: input.quantity ?? null,
      })
      .select()
      .single();

    if (error || !inserted) {
      return { error: error?.message ?? 'Could not save item.' };
    }

    const { data: insertedReminders, error: remindersError } = await supabase
      .from('reminders')
      .insert(offsets.map((offset_days) => ({ item_id: inserted.id, offset_days })))
      .select();

    const scheduledReminders = remindersError
      ? []
      : await rescheduleReminders(inserted as Item, (insertedReminders ?? []) as Reminder[]);
    await persistNotificationIds(scheduledReminders);

    set((state) => ({
      items: [...state.items, inserted as Item],
      remindersByItemId: { ...state.remindersByItemId, [inserted.id]: scheduledReminders },
      attachmentsByItemId: { ...state.attachmentsByItemId, [inserted.id]: [] },
    }));

    return { error: null, id: inserted.id };
  },

  updateItem: async (id, patch, userId) => {
    const keyDateChanged = patch.key_date !== undefined;

    if (!userId) {
      const guestItems = await readGuestItems();
      const idx = guestItems.findIndex((it) => it.id === id);
      if (idx === -1) return { error: 'Item not found.' };

      const updated: GuestItem = {
        ...guestItems[idx],
        ...patch,
        notes: patch.notes ?? guestItems[idx].notes,
        quantity: patch.quantity ?? guestItems[idx].quantity,
        updated_at: new Date().toISOString(),
      };
      // A changed key_date invalidates any previously scheduled reminders —
      // cancel and reschedule them so nothing fires against the old date.
      if (keyDateChanged) {
        updated.reminders = await rescheduleReminders(updated, guestItems[idx].reminders);
      }
      guestItems[idx] = updated;
      await writeGuestItems(guestItems);
      set((state) => ({
        items: state.items.map((it) => (it.id === id ? updated : it)),
        remindersByItemId: { ...state.remindersByItemId, [id]: updated.reminders },
      }));
      return { error: null };
    }

    const { data: updatedRow, error } = await supabase
      .from('items')
      .update({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.key_date !== undefined ? { key_date: patch.key_date } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedRow) {
      return { error: error?.message ?? 'Could not update item.' };
    }

    let scheduledReminders = get().remindersByItemId[id] ?? [];
    if (keyDateChanged) {
      // Stale notifications must never fire against the old date.
      scheduledReminders = await rescheduleReminders(updatedRow as Item, scheduledReminders);
      await persistNotificationIds(scheduledReminders);
    }

    set((state) => ({
      items: state.items.map((it) => (it.id === id ? (updatedRow as Item) : it)),
      remindersByItemId: keyDateChanged
        ? { ...state.remindersByItemId, [id]: scheduledReminders }
        : state.remindersByItemId,
    }));

    return { error: null };
  },

  archiveItem: async (id, userId) => {
    await cancelReminders(get().remindersByItemId[id] ?? []);
    const archived_at = new Date().toISOString();

    if (!userId) {
      const guestItems = await readGuestItems();
      const updated = guestItems.map((it) => (it.id === id ? { ...it, archived_at } : it));
      await writeGuestItems(updated);
      set((state) => ({ items: state.items.filter((it) => it.id !== id) }));
      return;
    }

    await supabase.from('items').update({ archived_at }).eq('id', id);
    set((state) => ({ items: state.items.filter((it) => it.id !== id) }));
  },

  deleteItem: async (id, userId) => {
    await cancelReminders(get().remindersByItemId[id] ?? []);
    await deleteAttachmentsFromStorage(get().attachmentsByItemId[id] ?? []);

    if (!userId) {
      const guestItems = await readGuestItems();
      const updated = guestItems.filter((it) => it.id !== id);
      await writeGuestItems(updated);
      set((state) => {
        const remindersByItemId = { ...state.remindersByItemId };
        const attachmentsByItemId = { ...state.attachmentsByItemId };
        delete remindersByItemId[id];
        delete attachmentsByItemId[id];
        return {
          items: state.items.filter((it) => it.id !== id),
          remindersByItemId,
          attachmentsByItemId,
          guestItemCount: updated.length,
        };
      });
      return;
    }

    await supabase.from('items').delete().eq('id', id);
    set((state) => {
      const remindersByItemId = { ...state.remindersByItemId };
      const attachmentsByItemId = { ...state.attachmentsByItemId };
      delete remindersByItemId[id];
      delete attachmentsByItemId[id];
      return { items: state.items.filter((it) => it.id !== id), remindersByItemId, attachmentsByItemId };
    });
  },

  addAttachment: async (itemId, localUri, userId) => {
    if (!userId) {
      const guestItems = await readGuestItems();
      const idx = guestItems.findIndex((it) => it.id === itemId);
      if (idx === -1) return { error: 'Item not found.' };

      const attachment: Attachment = {
        id: generateId(),
        item_id: itemId,
        file_url: localUri,
        file_type: 'image',
        created_at: new Date().toISOString(),
      };
      guestItems[idx] = { ...guestItems[idx], attachments: [...guestItems[idx].attachments, attachment] };
      await writeGuestItems(guestItems);
      set((state) => ({
        attachmentsByItemId: {
          ...state.attachmentsByItemId,
          [itemId]: [...(state.attachmentsByItemId[itemId] ?? []), attachment],
        },
      }));
      return { error: null };
    }

    const { path, error } = await uploadAttachment(userId, itemId, localUri);
    if (!path) {
      return { error: error ?? 'Could not upload photo.' };
    }

    const { data: inserted, error: insertError } = await supabase
      .from('attachments')
      .insert({ item_id: itemId, file_url: path, file_type: 'image' })
      .select()
      .single();

    if (insertError || !inserted) {
      await deleteAttachmentFile(path);
      return { error: insertError?.message ?? 'Could not save photo.' };
    }

    set((state) => ({
      attachmentsByItemId: {
        ...state.attachmentsByItemId,
        [itemId]: [...(state.attachmentsByItemId[itemId] ?? []), inserted as Attachment],
      },
    }));
    return { error: null };
  },

  deleteAttachment: async (attachmentId, itemId, userId) => {
    const existing = (get().attachmentsByItemId[itemId] ?? []).find((a) => a.id === attachmentId);

    if (!userId) {
      const guestItems = await readGuestItems();
      const idx = guestItems.findIndex((it) => it.id === itemId);
      if (idx !== -1) {
        guestItems[idx] = {
          ...guestItems[idx],
          attachments: guestItems[idx].attachments.filter((a) => a.id !== attachmentId),
        };
        await writeGuestItems(guestItems);
      }
    } else {
      if (existing && !isDisplayableUri(existing.file_url)) {
        await deleteAttachmentFile(existing.file_url);
      }
      await supabase.from('attachments').delete().eq('id', attachmentId);
    }

    set((state) => ({
      attachmentsByItemId: {
        ...state.attachmentsByItemId,
        [itemId]: (state.attachmentsByItemId[itemId] ?? []).filter((a) => a.id !== attachmentId),
      },
    }));
  },
}));
