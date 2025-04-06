
import React, { useState } from 'react';
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
  Save
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialContent, 
  onSave,
  readOnly = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);
  
  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      setIsDirty(true);
    }
  };
  
  const handleFormat = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    handleContentChange();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  const handleSave = () => {
    onSave(content);
    setIsDirty(false);
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
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave}
            disabled={!isDirty}
            type="button"
            className="ml-auto"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
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
