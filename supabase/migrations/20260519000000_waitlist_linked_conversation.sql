-- Conversation captured at waitlist signup (anonymous chats included).
-- Populated by the app when the user submits the email form.

alter table public.waitlist_submissions
  add column if not exists linked_conversation_id uuid
  references public.chatbot_conversations(id) on delete set null;

create index if not exists idx_waitlist_submissions_linked_conversation
  on public.waitlist_submissions(linked_conversation_id)
  where linked_conversation_id is not null;
