import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { chatbotPromptService, ChatbotPrompt } from '@/services/chatbotPromptService';
import { 
  FileText, 
  Save, 
  RotateCcw, 
  History, 
  Check,
  Plus,
  Clock,
  Loader2,
  X
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clearPromptCache } from '@/services/chatbotService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageSlug?: string;  // Which landing page's prompts to edit (defaults to 'default')
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ open, onOpenChange, pageSlug = 'default' }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit');
  
  // Current editing state
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  
  // Version history
  const [versions, setVersions] = useState<ChatbotPrompt[]>([]);
  const [activeVersion, setActiveVersion] = useState<ChatbotPrompt | null>(null);
  
  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  // Load prompts when modal opens or pageSlug changes
  useEffect(() => {
    if (open && user) {
      loadPrompts();
    }
  }, [open, user, pageSlug]);

  // Track changes
  useEffect(() => {
    if (activeVersion) {
      setHasChanges(systemPrompt !== activeVersion.system_prompt);
    }
  }, [systemPrompt, activeVersion]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const allVersions = await chatbotPromptService.getAllPrompts(pageSlug);
      setVersions(allVersions);
      
      // Find active version
      const active = allVersions.find(v => v.is_active);
      if (active) {
        setActiveVersion(active);
        setSystemPrompt(active.system_prompt);
      } else if (allVersions.length > 0) {
        // Use latest if no active
        setActiveVersion(allVersions[0]);
        setSystemPrompt(allVersions[0].system_prompt);
      } else {
        // No prompts exist for this page yet - start fresh
        setActiveVersion(null);
        setSystemPrompt('');
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewVersion = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const newPrompt = await chatbotPromptService.createPrompt(
        pageSlug,
        systemPrompt,
        user.id,
        true // Make it active
      );
      
      if (newPrompt) {
        // Clear the prompt cache so changes take effect immediately
        clearPromptCache();
        
        // Reload versions
        await loadPrompts();
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving new version:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (version: ChatbotPrompt) => {
    setIsSaving(true);
    try {
      await chatbotPromptService.activateVersion(version.id, pageSlug);
      
      // Clear the prompt cache so changes take effect immediately
      clearPromptCache();
      
      // Reload and update state
      await loadPrompts();
    } catch (error) {
      console.error('Error restoring version:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToActive = () => {
    if (activeVersion) {
      setSystemPrompt(activeVersion.system_prompt);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Friendly page name for display
  const pageLabel = pageSlug === 'default' ? 'General' :
    pageSlug === 'sleep' ? 'Sleep' :
    pageSlug === 'couples' ? 'Couples' :
    pageSlug === 'work-stress' ? 'Work Stress' :
    pageSlug;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-100">
              <FileText className="h-4 w-4 text-indigo-700" />
            </div>
            <span>Prompt Configuration</span>
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 text-xs ml-1">
              {pageLabel}
            </Badge>
            {activeVersion && (
              <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                v{activeVersion.version}
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                Unsaved
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'history')} className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="edit">
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Prompt
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  Version History ({versions.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="flex-1 overflow-hidden mt-4 flex flex-col">
                {/* Scrollable form fields */}
                <div className="flex-1 overflow-auto space-y-6 pr-1">
                  {/* System Prompt */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      System Prompt
                      <Badge variant="outline" className="text-xs font-normal">Hidden from users</Badge>
                    </label>
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder={`Enter system prompt for the ${pageLabel} page...`}
                      className="min-h-[250px] text-sm font-mono bg-white resize-y"
                    />
                    <p className="text-xs text-gray-500">
                      Hidden instructions that guide AI behavior for the <strong>{pageLabel}</strong> landing page.
                    </p>
                  </div>
                </div>
                
                {/* Actions - pinned at bottom */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t flex-shrink-0">
                  <div className="text-sm text-gray-500">
                    System prompt: {systemPrompt.length} chars
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleResetToActive}
                      disabled={!hasChanges}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={handleSaveNewVersion}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      disabled={(!hasChanges && versions.length > 0) || isSaving || !systemPrompt.trim()}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {versions.length === 0 ? 'Create First Version' : 'Save as New Version'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-3">
                    {versions.map((version) => (
                      <Card
                        key={version.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          version.is_active
                            ? 'border-2 border-green-400 bg-green-50/50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSystemPrompt(version.system_prompt);
                          setActiveTab('edit');
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-base">
                                Version {version.version}
                              </span>
                              {version.is_active && (
                                <Badge className="bg-green-500 text-white">
                                  <Check className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                              <Clock className="h-4 w-4" />
                              {formatDate(version.created_at)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">System Prompt:</span>
                              <p className="text-gray-600 line-clamp-3 mt-0.5 font-mono text-xs">
                                {version.system_prompt.substring(0, 200)}...
                              </p>
                            </div>
                          </div>
                          {!version.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreVersion(version);
                              }}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restore
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                    
                    {versions.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No prompt versions for <strong>{pageLabel}</strong>.</p>
                        <p className="text-sm mt-1">Switch to the Edit tab to create the first version.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
