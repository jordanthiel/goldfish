-- Create landing_pages table to store page configuration
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,            -- URL path segment: 'default', 'sleep', 'couples', 'work-stress'
    title TEXT NOT NULL,                   -- Display title
    description TEXT,                      -- Short description
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_active ON public.landing_pages(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed the landing pages
INSERT INTO public.landing_pages (slug, title, description, display_order) VALUES
    ('default', 'Mental Wellness', 'General therapist discovery', 0),
    ('sleep', 'Sleep Assessment', 'Sleep issues, insomnia, and rest quality', 1),
    ('couples', 'Couples Therapy', 'Relationship counseling and communication', 2),
    ('work-stress', 'Work Stress', 'Workplace wellness, burnout, and work-life balance', 3)
ON CONFLICT (slug) DO NOTHING;

-- Add page_id column to chatbot_prompts (nullable for backward compat)
ALTER TABLE public.chatbot_prompts
    ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.landing_pages(id);

-- Create index for page_id lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_prompts_page_id ON public.chatbot_prompts(page_id, is_active);

-- Link existing therapist_discovery prompts to the 'default' landing page
UPDATE public.chatbot_prompts
    SET page_id = (SELECT id FROM public.landing_pages WHERE slug = 'default')
    WHERE prompt_name = 'therapist_discovery' AND page_id IS NULL;

-- Drop the old unique constraint on (prompt_name, version) and replace with (page_id, version)
-- so each page can have its own version lineage
ALTER TABLE public.chatbot_prompts
    DROP CONSTRAINT IF EXISTS chatbot_prompts_name_version_unique;

ALTER TABLE public.chatbot_prompts
    ADD CONSTRAINT chatbot_prompts_page_version_unique UNIQUE(page_id, version);
