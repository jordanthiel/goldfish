import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { chatbotAppDefaultsService } from '@/services/chatbotAppDefaultsService';
import {
  AVAILABLE_MODELS,
  type ModelConfig,
  clearServerDefaultChatModelCache,
  hydrateServerDefaultChatModel,
} from '@/utils/modelConfig';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { BrandAppIcon } from '@/components/brand/BrandLogo';

const allModelsList = [
  ...AVAILABLE_MODELS.anthropic,
  ...AVAILABLE_MODELS.openai,
  ...AVAILABLE_MODELS.gemini,
];

const InternalDeveloperSettings: React.FC = () => {
  const { user, isInternal, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<ModelConfig | null>(null);

  useEffect(() => {
    if (!authLoading && !isInternal) {
      navigate('/');
      toast({
        title: 'Access denied',
        description: 'Internal access only.',
        variant: 'destructive',
      });
    }
  }, [authLoading, isInternal, navigate, toast]);

  useEffect(() => {
    if (!isInternal) return;

    const load = async () => {
      setLoading(true);
      try {
        const row = await chatbotAppDefaultsService.getDefaults();
        if (row) {
          const found = allModelsList.find(
            (m) => m.provider === row.default_chat_provider && m.modelId === row.default_chat_model_id,
          );
          setSelected(found ?? allModelsList[0]);
        } else {
          setSelected(allModelsList[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isInternal]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await chatbotAppDefaultsService.updateDefaultModel(
        selected.provider,
        selected.modelId,
      );
      if (!res.ok) {
        toast({
          title: 'Save failed',
          description: res.error ?? 'Could not update defaults.',
          variant: 'destructive',
        });
        return;
      }
      clearServerDefaultChatModelCache();
      await hydrateServerDefaultChatModel();
      toast({
        title: 'Saved',
        description: `Default chat model is now ${selected.name} (${selected.provider}).`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isInternal) {
    return null;
  }

  const currentValue = selected ? `${selected.provider}:${selected.modelId}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/internal" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Internal
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <BrandAppIcon size="sm" />
            <span className="font-semibold text-gray-800">Developer settings</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-therapy-purple" />
              <CardTitle>Default chat model</CardTitle>
            </div>
            <CardDescription>
              Used for anonymous visitors and anyone without a personal model choice in this browser.
              Personal selection in the chat header still overrides this when set.
            </CardDescription>
            {user?.email && (
              <p className="text-xs text-muted-foreground pt-1">Signed in as {user.email}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {loading || !selected ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <>
                <Select
                  value={currentValue}
                  onValueChange={(value) => {
                    const [provider, modelId] = value.split(':');
                    const m = allModelsList.find(
                      (x) => x.provider === provider && x.modelId === modelId,
                    );
                    if (m) setSelected(m);
                  }}
                >
                  <SelectTrigger className="w-full max-w-md bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(400px,70vh)]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Anthropic</div>
                    {AVAILABLE_MODELS.anthropic.map((m) => (
                      <SelectItem key={`${m.provider}:${m.modelId}`} value={`${m.provider}:${m.modelId}`}>
                        {m.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">OpenAI</div>
                    {AVAILABLE_MODELS.openai.map((m) => (
                      <SelectItem key={`${m.provider}:${m.modelId}`} value={`${m.provider}:${m.modelId}`}>
                        {m.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Gemini</div>
                    {AVAILABLE_MODELS.gemini.map((m) => (
                      <SelectItem key={`${m.provider}:${m.modelId}`} value={`${m.provider}:${m.modelId}`}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>Preview:</span>
                  <Badge variant="outline">{selected.provider}</Badge>
                  <span className="font-medium">{selected.name}</span>
                </div>
                <Button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="bg-therapy-purple hover:bg-therapy-purple/90"
                >
                  {saving ? 'Saving…' : 'Save to server'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InternalDeveloperSettings;
