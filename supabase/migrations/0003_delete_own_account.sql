-- Lets a signed-in user permanently delete their own auth account straight
-- from the client — no service-role key, no Edge Function deploy step.
-- Run this in the Supabase SQL editor, same as the other migrations.
--
-- SECURITY DEFINER makes this run with the privileges of whoever created it
-- (the `postgres` role, when run via the SQL editor), which has the access
-- to auth.users that a normal `authenticated` caller doesn't. Callers only
-- ever get EXECUTE on this one function — never direct table access — and
-- it only ever deletes auth.uid()'s own row. auth.users cascades to Supabase's
-- own identities/sessions/refresh_tokens tables, so this is a full account
-- removal, not a partial one.
create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;
