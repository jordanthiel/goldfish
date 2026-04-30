-- Singleton row for product-wide chatbot defaults (e.g. default model for anonymous users).
CREATE TABLE IF NOT EXISTS public.chatbot_app_defaults (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_chat_provider text NOT NULL,
  default_chat_model_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.chatbot_app_defaults (id, default_chat_provider, default_chat_model_id)
VALUES (1, 'openai', 'gpt-5.2')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.chatbot_app_defaults ENABLE ROW LEVEL SECURITY;

-- Anyone can read (anonymous landing → chat needs default without auth).
CREATE POLICY "chatbot_app_defaults_select_public"
  ON public.chatbot_app_defaults
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only internal staff can change defaults.
CREATE POLICY "chatbot_app_defaults_update_internal"
  ON public.chatbot_app_defaults
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.is_internal = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.is_internal = true
    )
  );
