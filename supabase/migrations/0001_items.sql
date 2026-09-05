-- Expiry Radar core schema: items, reminders, attachments.
-- Run in the Supabase SQL editor, or via `supabase db push` if the project is linked.

create extension if not exists "pgcrypto";

create type item_category as enum (
  'documents',
  'food',
  'returns',
  'warranties',
  'subscriptions',
  'insurance',
  'finance',
  'vehicle',
  'other'
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category item_category not null,
  key_date date not null,
  notes text,
  quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists items_user_id_idx on items (user_id);
create index if not exists items_key_date_idx on items (key_date);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items (id) on delete cascade,
  offset_days integer not null,
  notification_id text
);

create index if not exists reminders_item_id_idx on reminders (item_id);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items (id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'pdf')),
  created_at timestamptz not null default now()
);

create index if not exists attachments_item_id_idx on attachments (item_id);

-- Keep updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_set_updated_at on items;
create trigger items_set_updated_at
  before update on items
  for each row
  execute function set_updated_at();

-- Row Level Security: every user can only see and modify their own items,
-- and reminders/attachments are scoped through their parent item.
alter table items enable row level security;
alter table reminders enable row level security;
alter table attachments enable row level security;

drop policy if exists "items_select_own" on items;
create policy "items_select_own" on items
  for select using (auth.uid() = user_id);

drop policy if exists "items_insert_own" on items;
create policy "items_insert_own" on items
  for insert with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on items;
create policy "items_update_own" on items
  for update using (auth.uid() = user_id);

drop policy if exists "items_delete_own" on items;
create policy "items_delete_own" on items
  for delete using (auth.uid() = user_id);

drop policy if exists "reminders_all_via_item" on reminders;
create policy "reminders_all_via_item" on reminders
  for all using (
    exists (select 1 from items where items.id = reminders.item_id and items.user_id = auth.uid())
  )
  with check (
    exists (select 1 from items where items.id = reminders.item_id and items.user_id = auth.uid())
  );

drop policy if exists "attachments_all_via_item" on attachments;
create policy "attachments_all_via_item" on attachments
  for all using (
    exists (select 1 from items where items.id = attachments.item_id and items.user_id = auth.uid())
  )
  with check (
    exists (select 1 from items where items.id = attachments.item_id and items.user_id = auth.uid())
  );
