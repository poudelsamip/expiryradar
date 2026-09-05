import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useItemsStore } from '@/store/useItemsStore';

// Attachment binaries are left out — only their metadata is exported. The
// binary files live in Supabase Storage (or on-device for guests) and
// aren't meaningful outside the app without re-uploading, which is out of
// scope for a JSON export.
export async function exportUserData(userId: string | null): Promise<{ error: string | null }> {
  await useItemsStore.getState().loadForUser(userId);
  const { items, remindersByItemId, attachmentsByItemId } = useItemsStore.getState();

  const payload = {
    exported_at: new Date().toISOString(),
    items: items.map((item) => ({
      ...item,
      reminders: (remindersByItemId[item.id] ?? []).map((r) => ({ offset_days: r.offset_days })),
      attachments: (attachmentsByItemId[item.id] ?? []).map((a) => ({
        file_type: a.file_type,
        created_at: a.created_at,
      })),
    })),
  };

  try {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { error: 'Sharing is not available on this device.' };
    }

    const file = new File(Paths.cache, `expiry-radar-export-${Date.now()}.json`);
    file.create({ overwrite: true });
    file.write(JSON.stringify(payload, null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Expiry Radar data',
    });
    return { error: null };
  } catch {
    return { error: 'Could not export your data.' };
  }
}
