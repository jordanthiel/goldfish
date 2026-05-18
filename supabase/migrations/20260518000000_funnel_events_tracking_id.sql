-- Denormalize share-link tracking id for reliable per-visitor analytics queries.

alter table public.funnel_events
  add column if not exists tracking_id text;

update public.funnel_events
set tracking_id = metadata->>'trackingId'
where tracking_id is null
  and metadata ? 'trackingId'
  and (metadata->>'trackingId') ~ '^[a-zA-Z0-9_-]{1,64}$';

alter table public.funnel_events
  add constraint funnel_events_tracking_id_format
  check (tracking_id is null or tracking_id ~ '^[a-zA-Z0-9_-]{1,64}$');

create index if not exists idx_funnel_events_tracking_id
  on public.funnel_events(tracking_id)
  where tracking_id is not null;

create index if not exists idx_funnel_events_tracking_session
  on public.funnel_events(tracking_id, session_id)
  where tracking_id is not null;
