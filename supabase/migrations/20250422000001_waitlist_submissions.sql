-- Waitlist / email capture submissions from the chat A/B test flow.
create table if not exists public.waitlist_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  ab_variant text not null check (ab_variant in ('A', 'B')),
  conversation_id uuid references public.chatbot_conversations(id),
  session_id text,
  page_slug text,
  created_at timestamptz not null default now()
);

-- Allow anonymous inserts so unauthenticated chat users can submit.
alter table public.waitlist_submissions enable row level security;

create policy "Anyone can insert waitlist submissions"
  on public.waitlist_submissions
  for insert
  with check (true);

-- Internal users can read all submissions for analytics.
create policy "Internal users can read waitlist submissions"
  on public.waitlist_submissions
  for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.is_internal = true
    )
  );

create index idx_waitlist_submissions_email on public.waitlist_submissions(email);
create index idx_waitlist_submissions_variant on public.waitlist_submissions(ab_variant);
create index idx_waitlist_submissions_created on public.waitlist_submissions(created_at desc);
