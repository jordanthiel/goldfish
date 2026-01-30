-- Create chatbot_conversations table to store chat sessions
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Nullable for anonymous users
    session_id TEXT NOT NULL, -- Unique session identifier for anonymous users
    model_provider TEXT NOT NULL, -- 'openai' or 'gemini'
    model_id TEXT NOT NULL, -- e.g., 'gpt-5.2', 'gemini-3-flash-preview'
    conversation_data JSONB NOT NULL, -- Array of messages with roles and content
    device_info JSONB, -- IP address, user agent, location, etc.
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON public.chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON public.chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_started_at ON public.chatbot_conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_model_provider ON public.chatbot_conversations(model_provider);

-- Create trigger for updated_at
CREATE TRIGGER update_chatbot_conversations_updated_at BEFORE UPDATE ON public.chatbot_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
