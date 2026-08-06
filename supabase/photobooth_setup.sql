-- Visriva Photo Booth — Supabase setup
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/dzyulttdcyyddasthfjob/sql

-- Print queue table (webbooth → webprinter)
create table if not exists public.print_jobs (
  id text primary key,
  image_url text not null,
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'printing', 'printed', 'failed')),
  source text default 'webbooth',
  capture_id text,
  created_at timestamptz not null default now(),
  printed_at timestamptz,
  error text
);

create index if not exists print_jobs_status_created_idx
  on public.print_jobs (status, created_at desc);

alter table public.print_jobs enable row level security;

-- Event kiosk: anon can read + create + update print queue
create policy "print_jobs_anon_select" on public.print_jobs
  for select to anon using (true);

create policy "print_jobs_anon_insert" on public.print_jobs
  for insert to anon with check (true);

create policy "print_jobs_anon_update" on public.print_jobs
  for update to anon using (true) with check (true);

-- Storage bucket for keepsake JPEGs
insert into storage.buckets (id, name, public)
values ('photobooth-prints', 'photobooth-prints', true)
on conflict (id) do update set public = true;

create policy "photobooth_prints_public_read" on storage.objects
  for select to anon using (bucket_id = 'photobooth-prints');

create policy "photobooth_prints_anon_insert" on storage.objects
  for insert to anon with check (bucket_id = 'photobooth-prints');

-- Enable realtime for webprinter live queue
alter publication supabase_realtime add table public.print_jobs;
