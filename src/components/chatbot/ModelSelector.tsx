import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSelectedModel, setSelectedModel, AVAILABLE_MODELS, ModelConfig } from '@/utils/modelConfig';
import { Settings, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PromptEditor } from './PromptEditor';

interface ModelSelectorProps {
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ compact = false }) => {
  const [selectedModel, setSelectedModelState] = React.useState<ModelConfig>(getSelectedModel());
  const [promptEditorOpen, setPromptEditorOpen] = useState(false);
  const { user } = useAuth();

  // Only show for logged in users
  if (!user) {
    return null;
  }

  const handleModelChange = (value: string) => {
    const [provider, modelId] = value.split(':');
    const allModels = [
      ...AVAILABLE_MODELS.anthropic,
      ...AVAILABLE_MODELS.openai,
      ...AVAILABLE_MODELS.gemini,
    ];
    const model = allModels.find(
      (m) => m.provider === provider && m.modelId === modelId
    );
    
    if (model) {
      setSelectedModelState(model);
      setSelectedModel(model);
    }
  };

  const currentValue = `${selectedModel.provider}:${selectedModel.modelId}`;

  const getProviderColor = (provider: string) => {
    if (provider === 'openai') return 'bg-green-100 text-green-700 border-green-200';
    if (provider === 'anthropic') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  const getProviderLabel = (provider: string) => {
    if (provider === 'openai') return 'OpenAI';
    if (provider === 'anthropic') return 'Anthropic';
    return 'Gemini';
  };

  const selectElement = (
    <Select value={currentValue} onValueChange={handleModelChange}>
      <SelectTrigger className={`bg-white border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-amber-500 ${compact ? 'h-9 min-w-[180px]' : 'h-10 w-full'}`}>
        <div className="flex items-center gap-2 w-full overflow-hidden">
          <Badge 
            variant="outline" 
            className={`${getProviderColor(selectedModel.provider)} text-xs font-medium px-2 py-0.5 shrink-0`}
          >
            {getProviderLabel(selectedModel.provider)}
          </Badge>
          <span className="font-medium text-sm truncate">{selectedModel.name}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Anthropic</span>
          </div>
        </div>
        {AVAILABLE_MODELS.anthropic.map((model) => (
          <SelectItem
            key={`${model.provider}:${model.modelId}`}
            value={`${model.provider}:${model.modelId}`}
            className="py-3 px-3 cursor-pointer"
          >
            <div className="flex items-start gap-3 w-full">
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{model.name}</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs px-1.5 py-0">
                    Latest
                  </Badge>
                </div>
                {model.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">{model.description}</p>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
        <SelectSeparator className="my-2" />
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">OpenAI Models</span>
          </div>
        </div>
        {AVAILABLE_MODELS.openai.map((model) => (
          <SelectItem
            key={`${model.provider}:${model.modelId}`}
            value={`${model.provider}:${model.modelId}`}
            className="py-3 px-3 cursor-pointer"
          >
            <div className="flex items-start gap-3 w-full">
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{model.name}</span>
                  {model.modelId.includes('5.2') && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs px-1.5 py-0">
                      Latest
                    </Badge>
                  )}
                </div>
                {model.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">{model.description}</p>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
        <SelectSeparator className="my-2" />
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Gemini Models</span>
          </div>
        </div>
        {AVAILABLE_MODELS.gemini.map((model) => (
          <SelectItem
            key={`${model.provider}:${model.modelId}`}
            value={`${model.provider}:${model.modelId}`}
            className="py-3 px-3 cursor-pointer"
          >
            <div className="flex items-start gap-3 w-full">
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{model.name}</span>
                  {model.modelId.includes('3.0') && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs px-1.5 py-0">
                      Latest
                    </Badge>
                  )}
                </div>
                {model.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">{model.description}</p>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Compact mode - just the select dropdown
  if (compact) {
    return selectElement;
  }

  // Full mode - with card wrapper
  return (
    <Card className="mb-4 border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-100">
              <Settings className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI Model Selection</h3>
              <p className="text-xs text-gray-500">Choose your preferred AI model</p>
            </div>
          </div>
        </div>

        {selectElement}
      </div>

      {/* Prompt Editor Modal */}
      <PromptEditor open={promptEditorOpen} onOpenChange={setPromptEditorOpen} />
    </Card>
  );
};
