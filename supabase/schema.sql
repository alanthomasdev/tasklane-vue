-- Tasklane database setup.
-- Run this once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- It is safe to run again; it won't delete any data.

-- 1. The tasks table. One row per task; each row belongs to one user.
create table if not exists public.tasks (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  notes       text not null default '' check (char_length(notes) <= 200),
  due_date    date not null,
  due_time    text not null default '09:00' check (due_time ~ '^[0-9]{2}:[0-9]{2}$'),
  status      text not null default 'todo' check (status in ('todo', 'progress', 'done')),
  progress    smallint not null default 0 check (progress between 0 and 100),
  color       text not null default 'indigo' check (color in ('indigo', 'rose', 'amber', 'mint')),
  emoji       text not null default '' check (char_length(emoji) <= 16),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

-- 2. Security: people can only see and change their own tasks.
alter table public.tasks enable row level security;

drop policy if exists "Read own tasks" on public.tasks;
create policy "Read own tasks" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Add own tasks" on public.tasks;
create policy "Add own tasks" on public.tasks
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Edit own tasks" on public.tasks;
create policy "Edit own tasks" on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own tasks" on public.tasks;
create policy "Delete own tasks" on public.tasks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Signed-in users may use the table (the policies above still apply); signed-out visitors may not.
grant select, insert, update, delete on public.tasks to authenticated;
revoke all on public.tasks from anon;

-- 3. Keep updated_at current on every change.
create or replace function public.tasks_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.tasks_touch_updated_at();

-- 4. Live updates: tell the app instantly when a task changes on another device.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end;
$$;
