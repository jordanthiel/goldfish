-- Remove "Start by" / "Let's start by" phrasing from stored prompts (existing deployments).

UPDATE public.chatbot_prompts
SET
  system_prompt = REPLACE(
    system_prompt,
    '1. Start by understanding what brings them here - their concerns, what they''re going through, and what they hope to get from therapy.',
    '1. Understand what brings them here—their concerns, what they''re going through, and what they hope to get from therapy.'
  ),
  updated_at = now()
WHERE system_prompt LIKE '%Start by understanding what brings them here%';

UPDATE public.chatbot_prompts
SET
  system_prompt = regexp_replace(system_prompt, 'Start by understanding', 'Understand', 'gi'),
  updated_at = now()
WHERE system_prompt ~* 'start by understanding';

UPDATE public.chatbot_prompts
SET
  initial_greeting = trim(both ' ' from replace(replace(
    initial_greeting,
    'Let''s start by getting to know you a bit. ',
    ''
  ),
    'Let''s start by getting to know you a bit.',
    ''
  )),
  updated_at = now()
WHERE initial_greeting ILIKE '%let''s start by%';

ALTER TABLE public.chatbot_prompts
  ALTER COLUMN initial_greeting SET DEFAULT 'Hi! I''m here to help you find a therapist who truly understands you. What brings you here today?';
