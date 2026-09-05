import { supabase } from '@/lib/supabase';
import { useItemsStore } from '@/store/useItemsStore';

// Deletes every item (and, via the item store, their reminders' local
// notifications and their Storage attachment files) for this user — a hard
// delete, not the soft-delete used for day-to-day archiving.
async function deleteAllUserData(userId: string): Promise<void> {
  await useItemsStore.getState().loadForUser(userId);
  const { items, deleteItem } = useItemsStore.getState();
  for (const item of items) {
    await deleteItem(item.id, userId);
  }
}

// Full account deletion: wipes all of the user's data, then calls the
// `delete_own_account` SQL function (see supabase/migrations/0003) to remove
// the auth user's own row directly — no service-role key or server deploy
// needed, since it runs as a SECURITY DEFINER function inside Postgres.
export async function deleteAccount(userId: string): Promise<{ error: string | null }> {
  await deleteAllUserData(userId);

  const { error } = await supabase.rpc('delete_own_account');
  if (error) {
    await supabase.auth.signOut();
    return {
      error:
        'Your data was deleted, but the account record itself could not be removed. Make sure the 0003_delete_own_account.sql migration has been run in the Supabase SQL editor, then contact support if it still fails.',
    };
  }

  await supabase.auth.signOut();
  return { error: null };
}
