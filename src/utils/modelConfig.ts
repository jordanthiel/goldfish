// Model configuration for AI providers
export type AIProvider = 'openai' | 'gemini' | 'anthropic';

export interface ModelConfig {
  provider: AIProvider;
  modelId: string;
  name: string;
  description?: string;
}

// Available models for each provider
export const AVAILABLE_MODELS: Record<AIProvider, ModelConfig[]> = {
  anthropic: [
    {
      provider: 'anthropic',
      modelId: 'claude-opus-4-6',
      name: 'Claude Opus 4.6',
      description: 'Anthropic’s most capable model — nuanced judgment and complex multi-step reasoning',
    },
  ],
  openai: [
    {
      provider: 'openai',
      modelId: 'gpt-5.2',
      name: 'GPT-5.2',
      description: 'The best model for coding and agentic tasks across industries',
    },
    {
      provider: 'openai',
      modelId: 'gpt-5.2-pro',
      name: 'GPT-5.2 Pro',
      description: 'Version of GPT-5.2 that produces smarter and more precise responses',
    },
    {
      provider: 'openai',
      modelId: 'gpt-5',
      name: 'GPT-5',
      description: 'Previous intelligent reasoning model for coding and agentic tasks with configurable reasoning effort',
    },
    {
      provider: 'openai',
      modelId: 'gpt-5-mini',
      name: 'GPT-5 Mini',
      description: 'A faster, cost-efficient version of GPT-5 for well-defined tasks',
    },
    {
      provider: 'openai',
      modelId: 'gpt-5-nano',
      name: 'GPT-5 Nano',
      description: 'Fastest, most cost-efficient version of GPT-5',
    },
    {
      provider: 'openai',
      modelId: 'gpt-4.1',
      name: 'GPT-4.1',
      description: 'Smartest non-reasoning model',
    },
    {
      provider: 'openai',
      modelId: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Most capable model, best for complex tasks',
    },
    {
      provider: 'openai',
      modelId: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Fast and cost-effective, recommended for most use cases',
    },
    {
      provider: 'openai',
      modelId: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'High performance with extended context',
    },
    {
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and economical',
    },
  ],
  gemini: [
    {
      provider: 'gemini',
      modelId: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash',
      description: 'Latest fast model with improved performance',
    },
    {
      provider: 'gemini',
      modelId: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro',
      description: 'Most capable Gemini 3 model with advanced reasoning',
    },
    {
      provider: 'gemini',
      modelId: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      description: 'Latest experimental model, very fast',
    },
    {
      provider: 'gemini',
      modelId: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Most capable Gemini model with long context',
    },
    {
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast and efficient, great for most tasks',
    },
  ],
};

// Default model (used in production)
export const DEFAULT_MODEL: ModelConfig = {
  provider: 'openai',
  modelId: 'gpt-5.2',
  name: 'GPT-5.2',
};

// Check if we're in development mode
export const isDevMode = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

// Get selected model from localStorage
export const getSelectedModel = (): ModelConfig => {
  try {
    const stored = localStorage.getItem('chatbot_model_selection');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that the model still exists
      const allModels = [
        ...AVAILABLE_MODELS.anthropic,
        ...AVAILABLE_MODELS.openai,
        ...AVAILABLE_MODELS.gemini,
      ];
      const found = allModels.find(
        (m) => m.provider === parsed.provider && m.modelId === parsed.modelId
      );
      if (found) {
        return found;
      }
    }
  } catch (error) {
    console.error('Error loading model selection:', error);
  }

  return DEFAULT_MODEL;
};

// Save selected model to localStorage
export const setSelectedModel = (model: ModelConfig): void => {
  try {
    localStorage.setItem('chatbot_model_selection', JSON.stringify(model));
  } catch (error) {
    console.error('Error saving model selection:', error);
  }
};
