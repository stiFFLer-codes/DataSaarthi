-- Run this in the Supabase SQL Editor to create the reports table.

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table reports enable row level security;

create policy "Users can view own reports"
  on reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on reports for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own reports"
  on reports for delete
  using (auth.uid() = user_id);
