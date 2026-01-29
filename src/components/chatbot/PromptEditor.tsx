import React, { useState, useEffect } from 'react';
import { Save, Loader2, Settings, History, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { chatbotPromptService, ChatbotPrompt } from '@/services/chatbotPromptService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PromptEditorProps {
  onClose?: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [versions, setVersions] = useState<ChatbotPrompt[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadPrompt();
    loadVersions();
  }, []);

  const loadPrompt = async () => {
    setIsLoading(true);
    try {
      const latestPrompt = await chatbotPromptService.getLatestPrompt();
      if (latestPrompt) {
        setPrompt(latestPrompt.system_prompt);
        setIsActive(latestPrompt.is_active);
      } else {
        // Load active prompt as fallback
        const activePrompt = await chatbotPromptService.getActivePrompt();
        setPrompt(activePrompt);
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prompt',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const allVersions = await chatbotPromptService.getAllPrompts();
      setVersions(allVersions);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    setIsRestoring(versionId);
    try {
      const restored = await chatbotPromptService.activateVersion(versionId);
      if (restored) {
        toast({
          title: 'Success',
          description: `Version ${restored.version} has been restored and is now active`,
        });
        // Reload data
        await loadPrompt();
        await loadVersions();
      } else {
        throw new Error('Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(null);
    }
  };

  const handleToggleExpand = (versionId: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Prompt cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await chatbotPromptService.createPrompt(
        'therapist_discovery',
        prompt.trim(),
        user?.id,
        isActive // Pass the isActive state
      );

      if (saved) {
        toast({
          title: 'Success',
          description: 'Prompt saved successfully',
        });
        // Reload versions to show the new one
        await loadVersions();
        onClose?.();
      } else {
        throw new Error('Failed to save prompt');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to save prompt',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Edit Chatbot Prompt</CardTitle>
        </div>
        <CardDescription>
          Update the system prompt that guides the chatbot conversation. Changes will be saved as a new version.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Prompt</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Version History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter the system prompt for the chatbot..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                This prompt defines how the chatbot behaves and what information it collects from users.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active" className="text-sm text-gray-500 cursor-pointer">
                  New version will be active
                </Label>
              </div>
              <div className="flex gap-2">
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isSaving} variant="default">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-3">
              {isLoadingVersions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No version history found
                </div>
              ) : (
                versions.map((version) => (
                  <Card
                    key={version.id}
                    className={`${
                      version.is_active ? 'border-blue-500 bg-blue-50/50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">Version {version.version}</span>
                            {version.is_active && (
                              <Badge variant="default" className="bg-blue-600">
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className={`text-sm text-gray-600 mb-3 font-mono whitespace-pre-wrap ${
                            expandedVersions.has(version.id) ? '' : 'line-clamp-3'
                          }`}>
                            {version.system_prompt}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleExpand(version.id)}
                            >
                              {expandedVersions.has(version.id) ? 'Show Less' : 'View Full'}
                            </Button>
                            {!version.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreVersion(version.id)}
                                disabled={isRestoring === version.id}
                              >
                                {isRestoring === version.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Restoring...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Restore
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
