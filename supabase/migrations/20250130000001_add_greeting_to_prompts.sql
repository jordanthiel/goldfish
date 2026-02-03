-- Add initial_greeting column to chatbot_prompts table
ALTER TABLE public.chatbot_prompts 
ADD COLUMN IF NOT EXISTS initial_greeting TEXT;

-- Update existing rows with a default greeting
UPDATE public.chatbot_prompts 
SET initial_greeting = 'Hi! I''m here to help you find a therapist who truly understands you. Let''s start by getting to know you a bit. What brings you here today?'
WHERE initial_greeting IS NULL;

-- Make the column NOT NULL with a default after populating existing rows
ALTER TABLE public.chatbot_prompts 
ALTER COLUMN initial_greeting SET DEFAULT 'Hi! I''m here to help you find a therapist who truly understands you. Let''s start by getting to know you a bit. What brings you here today?';
