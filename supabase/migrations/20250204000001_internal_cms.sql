-- Add is_internal flag to user_roles table to identify internal users
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- Create index for internal users lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_is_internal ON public.user_roles(is_internal);

-- Create table to store AI-extracted conversation data
CREATE TABLE IF NOT EXISTS public.conversation_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL UNIQUE,
    -- Extracted user details
    extracted_name TEXT,
    extracted_age INTEGER,
    extracted_gender TEXT,
    extracted_email TEXT,
    -- Case information
    case_summary TEXT,
    recommendation TEXT,
    -- Parsed chat history for quick access
    chat_history JSONB,
    -- Analysis metadata
    model_used TEXT NOT NULL,
    extraction_prompt TEXT,
    raw_extraction JSONB, -- Store the full raw response from Gemini
    -- Timestamps
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Foreign key to conversation
    CONSTRAINT conversation_extractions_conversation_id_fkey 
        FOREIGN KEY (conversation_id) 
        REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE
);

-- Create indexes for conversation_extractions
CREATE INDEX IF NOT EXISTS idx_conversation_extractions_conversation_id 
    ON public.conversation_extractions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_extractions_extracted_at 
    ON public.conversation_extractions(extracted_at);
CREATE INDEX IF NOT EXISTS idx_conversation_extractions_extracted_name 
    ON public.conversation_extractions(extracted_name);
CREATE INDEX IF NOT EXISTS idx_conversation_extractions_extracted_email 
    ON public.conversation_extractions(extracted_email);

-- Create trigger for updated_at
CREATE TRIGGER update_conversation_extractions_updated_at 
    BEFORE UPDATE ON public.conversation_extractions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create table for internal chat threads (for aggregate/specific conversation analysis)
CREATE TABLE IF NOT EXISTS public.internal_analysis_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- The internal user who created this thread
    thread_type TEXT NOT NULL, -- 'aggregate' or 'specific'
    conversation_id UUID, -- If specific, which conversation this is about
    title TEXT,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Foreign keys
    CONSTRAINT internal_analysis_threads_conversation_id_fkey 
        FOREIGN KEY (conversation_id) 
        REFERENCES public.chatbot_conversations(id) ON DELETE SET NULL
);

-- Create indexes for internal_analysis_threads
CREATE INDEX IF NOT EXISTS idx_internal_analysis_threads_user_id 
    ON public.internal_analysis_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_analysis_threads_thread_type 
    ON public.internal_analysis_threads(thread_type);
CREATE INDEX IF NOT EXISTS idx_internal_analysis_threads_conversation_id 
    ON public.internal_analysis_threads(conversation_id);

-- Create trigger for updated_at
CREATE TRIGGER update_internal_analysis_threads_updated_at 
    BEFORE UPDATE ON public.internal_analysis_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE public.conversation_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_analysis_threads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversation_extractions (internal users only)
CREATE POLICY "Internal users can view all conversation extractions" 
    ON public.conversation_extractions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );

CREATE POLICY "Internal users can insert conversation extractions" 
    ON public.conversation_extractions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );

CREATE POLICY "Internal users can update conversation extractions" 
    ON public.conversation_extractions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );

-- Create RLS policies for internal_analysis_threads
CREATE POLICY "Internal users can view their own analysis threads" 
    ON public.internal_analysis_threads
    FOR SELECT
    USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );

CREATE POLICY "Internal users can insert their own analysis threads" 
    ON public.internal_analysis_threads
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );

CREATE POLICY "Internal users can update their own analysis threads" 
    ON public.internal_analysis_threads
    FOR UPDATE
    USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );

CREATE POLICY "Internal users can delete their own analysis threads" 
    ON public.internal_analysis_threads
    FOR DELETE
    USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );

-- Also allow internal users to view all chatbot_conversations
CREATE POLICY "Internal users can view all chatbot conversations" 
    ON public.chatbot_conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND is_internal = true
        )
    );
