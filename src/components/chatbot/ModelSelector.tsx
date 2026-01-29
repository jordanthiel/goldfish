import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getSelectedModel, setSelectedModel, AVAILABLE_MODELS, isDevMode, ModelConfig } from '@/utils/modelConfig';
import { Settings, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const ModelSelector: React.FC = () => {
  const [selectedModel, setSelectedModelState] = React.useState<ModelConfig>(getSelectedModel());
  const { user } = useAuth();

  // Only show in dev mode and for logged in users
  if (!isDevMode() || !user) {
    return null;
  }

  const handleModelChange = (value: string) => {
    const [provider, modelId] = value.split(':');
    const allModels = [
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
    return provider === 'openai' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-purple-100 text-purple-700 border-purple-200';
  };

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
              <p className="text-xs text-gray-500">Development Mode</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Dev
          </Badge>
        </div>

        <Select value={currentValue} onValueChange={handleModelChange}>
          <SelectTrigger className="h-10 w-full bg-white border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-amber-500">
            <div className="flex items-center gap-2 w-full">
              <Badge 
                variant="outline" 
                className={`${getProviderColor(selectedModel.provider)} text-xs font-medium px-2 py-0.5`}
              >
                {selectedModel.provider === 'openai' ? 'OpenAI' : 'Gemini'}
              </Badge>
              <SelectValue className="flex-1 text-left">
                <span className="font-medium">{selectedModel.name}</span>
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
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

        <div className="mt-3 pt-3 border-t border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Active Model:</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getProviderColor(selectedModel.provider)} text-xs font-medium`}
              >
                {selectedModel.provider === 'openai' ? 'OpenAI' : 'Gemini'}
              </Badge>
              <span className="text-xs font-semibold text-gray-900">{selectedModel.name}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
