-- Personalized share links: ?id=<tracking_id> on landing pages.
-- Labels are optional; any valid id in the URL is tracked even if not pre-registered.

create table if not exists public.share_links (
  id text primary key,
  label text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint share_links_id_format check (id ~ '^[a-zA-Z0-9_-]{1,64}$')
);

create trigger update_share_links_updated_at
  before update on public.share_links
  for each row execute function update_updated_at_column();

create table if not exists public.share_link_visits (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null,
  session_id text not null,
  page_slug text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint share_link_visits_tracking_id_format check (tracking_id ~ '^[a-zA-Z0-9_-]{1,64}$')
);

create index idx_share_link_visits_tracking_id on public.share_link_visits(tracking_id);
create index idx_share_link_visits_created_at on public.share_link_visits(created_at desc);
create index idx_share_link_visits_session on public.share_link_visits(session_id);

alter table public.share_links enable row level security;
alter table public.share_link_visits enable row level security;

-- Anonymous visitors can log opens.
create policy "Anyone can insert share link visits"
  on public.share_link_visits
  for insert
  with check (true);

-- Internal users manage link registry and read visits.
create policy "Internal users can read share links"
  on public.share_links
  for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.is_internal = true
    )
  );

create policy "Internal users can insert share links"
  on public.share_links
  for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.is_internal = true
    )
  );

create policy "Internal users can update share links"
  on public.share_links
  for update
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.is_internal = true
    )
  );

create policy "Internal users can delete share links"
  on public.share_links
  for delete
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.is_internal = true
    )
  );

create policy "Internal users can read share link visits"
  on public.share_link_visits
  for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.is_internal = true
    )
  );

-- Speed up funnel queries filtered by tracking id in metadata.
create index idx_funnel_events_metadata_tracking_id
  on public.funnel_events ((metadata->>'trackingId'))
  where metadata ? 'trackingId';
