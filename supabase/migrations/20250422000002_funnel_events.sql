-- Lightweight event log for the chat-to-waitlist funnel.
-- Every row is a single event; analytics queries aggregate at read time.
create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id text not null,
  conversation_id uuid references public.chatbot_conversations(id),
  ab_variant text check (ab_variant in ('A', 'B')),
  page_slug text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.funnel_events enable row level security;

-- Anonymous users can insert events.
create policy "Anyone can insert funnel events"
  on public.funnel_events
  for insert
  with check (true);

-- Internal users can read for dashboards.
create policy "Internal users can read funnel events"
  on public.funnel_events
  for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.is_internal = true
    )
  );

create index idx_funnel_events_name on public.funnel_events(event_name);
create index idx_funnel_events_session on public.funnel_events(session_id);
create index idx_funnel_events_created on public.funnel_events(created_at desc);
create index idx_funnel_events_variant on public.funnel_events(ab_variant);
