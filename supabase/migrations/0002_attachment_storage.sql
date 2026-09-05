-- Storage bucket for item attachment photos. Kept private (not public) since
-- these can be passports, insurance documents, etc. — the app reads them via
-- short-lived signed URLs generated with the viewer's own session.
-- Run in the Supabase SQL editor, or via `supabase db push` if the project is linked.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Files are stored at `${user_id}/${item_id}/${filename}`, so ownership is
-- enforced by the first path segment matching the uploader's own id.
drop policy if exists "attachments_read_own" on storage.objects;
create policy "attachments_read_own" on storage.objects
  for select using (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments_insert_own" on storage.objects;
create policy "attachments_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments_delete_own" on storage.objects;
create policy "attachments_delete_own" on storage.objects
  for delete using (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );
