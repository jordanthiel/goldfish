
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Save,
  CheckCircle2
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialContent, 
  onSave,
  readOnly = false,
  autoSave = false,
  autoSaveInterval = 3000 // default to 3 seconds
}) => {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<'unsaved' | 'saving' | 'saved'>('saved');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedContent = useRef(initialContent);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
    
    // Clear any existing auto-save timer when component unmounts
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [initialContent]);
  
  useEffect(() => {
    // Set up auto-save if enabled
    if (autoSave && isDirty && !readOnly) {
      setSaveState('unsaved');
      
      // Clear any existing timeout to prevent multiple saves
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set new timeout
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, autoSaveInterval);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, isDirty, autoSave, autoSaveInterval, readOnly]);
  
  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      
      // Only mark as dirty if content has changed since last save
      if (newContent !== lastSavedContent.current) {
        setIsDirty(true);
        if (saveState === 'saved') setSaveState('unsaved');
      }
    }
  };
  
  const handleFormat = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    handleContentChange();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  const handleAutoSave = async () => {
    if (isDirty && content !== lastSavedContent.current) {
      setSaveState('saving');
      try {
        await onSave(content);
        lastSavedContent.current = content;
        setIsDirty(false);
        setSaveState('saved');
        
        // Show saved state for 2 seconds then reset
        setTimeout(() => {
          if (saveState === 'saved') {
            setSaveState('saved');
          }
        }, 2000);
      } catch (error) {
        console.error('Error auto-saving content:', error);
        setSaveState('unsaved');
      }
    }
  };
  
  const handleManualSave = async () => {
    setSaveState('saving');
    try {
      await onSave(content);
      lastSavedContent.current = content;
      setIsDirty(false);
      setSaveState('saved');
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveState('unsaved');
    }
  };
  
  return (
    <div className="border rounded-md">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('bold')}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('italic')}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('underline')}
            type="button"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('insertUnorderedList')}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('insertOrderedList')}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('formatBlock', '<h1>')}
            type="button"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('formatBlock', '<h2>')}
            type="button"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('formatBlock', '<h3>')}
            type="button"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('justifyLeft')}
            type="button"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('justifyCenter')}
            type="button"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('justifyRight')}
            type="button"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            {saveState === 'unsaved' && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
            {saveState === 'saving' && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
            {saveState === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </span>
            )}
            <Button 
              variant={saveState === 'unsaved' ? "default" : "outline"} 
              size="sm" 
              onClick={handleManualSave}
              disabled={!isDirty || saveState === 'saving'}
              type="button"
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          </div>
        </div>
      )}
      <div
        ref={editorRef}
        className="min-h-[200px] p-4 prose prose-sm max-w-none focus:outline-none"
        contentEditable={!readOnly}
        onInput={handleContentChange}
        onBlur={handleContentChange}
      />
    </div>
  );
};

export default RichTextEditor;
