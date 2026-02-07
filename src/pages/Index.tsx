import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Sparkles, ArrowUp, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModelSelector } from '@/components/chatbot/ModelSelector';
import { PromptEditor } from '@/components/chatbot/PromptEditor';
import { useAuth } from '@/context/AuthContext';

// Animated placeholder prompts
const PLACEHOLDER_PROMPTS = [
  "I'm feeling anxious about work and need help managing stress...",
  "I want to find a therapist who specializes in relationship issues...",
  "I'm looking for someone who understands depression and can help...",
  "I need a therapist who works with LGBTQ+ clients...",
  "I'm struggling with grief after losing a loved one...",
  "I want to work on my self-esteem and confidence...",
  "I need help dealing with trauma from my past...",
  "I'm looking for couples therapy to improve my relationship...",
];

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [input, setInput] = useState('');
  const [showDevMode, setShowDevMode] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  
  // Animated placeholder state
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animated placeholder effect
  useEffect(() => {
    const currentPrompt = PLACEHOLDER_PROMPTS[placeholderIndex];
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    if (isTyping) {
      // Typing animation
      const typeChar = () => {
        if (charIndex <= currentPrompt.length) {
          setDisplayedPlaceholder(currentPrompt.slice(0, charIndex));
          charIndex++;
          timeoutId = setTimeout(typeChar, 40);
        } else {
          // Pause at end of typing
          timeoutId = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      };
      typeChar();
    } else {
      // Deleting animation
      let deleteIndex = currentPrompt.length;
      const deleteChar = () => {
        if (deleteIndex >= 0) {
          setDisplayedPlaceholder(currentPrompt.slice(0, deleteIndex));
          deleteIndex--;
          timeoutId = setTimeout(deleteChar, 20);
        } else {
          // Move to next prompt
          setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
          setIsTyping(true);
        }
      };
      deleteChar();
    }
    
    return () => clearTimeout(timeoutId);
  }, [placeholderIndex, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Navigate to chat page with the initial message
    const encodedMessage = encodeURIComponent(input.trim());
    navigate(`/chat?message=${encodedMessage}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-3xl" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full py-6 px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Goldfish</span>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDevMode(!showDevMode)}
                    className="text-gray-600"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showDevMode ? 'Hide' : 'Dev'}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-therapy-purple text-white">
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-sm">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-gray-600">
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild className="bg-therapy-purple hover:bg-therapy-purple/90">
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dev Mode Panel */}
        {showDevMode && user && (
          <div className="max-w-6xl mx-auto px-4 mb-4">
            <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="font-semibold text-amber-900">Developer Mode</h3>
                  <p className="text-sm text-amber-700">Configure the AI model and prompt</p>
                </div>
                <div className="flex items-center gap-3">
                  <ModelSelector compact />
                  <Button variant="outline" size="sm" onClick={() => setShowPromptEditor(true)}>
                    Edit Prompt
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-gray-800 mb-6 leading-tight tracking-tight">
              Find Your Path to
              <br />
              <span className="italic text-therapy-purple">Mental Wellness</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Connect with the right therapist for you. Our AI assistant helps match you with mental health professionals who understand your unique needs.
            </p>
          </div>

          {/* Chat input card */}
          <div className="w-full max-w-2xl">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={displayedPlaceholder || "Tell us what you're looking for..."}
                    className="min-h-[120px] resize-none border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 pr-14"
                    style={{ fontSize: '17px', lineHeight: '1.6' }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    size="icon"
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-therapy-purple hover:bg-therapy-purple/90 shadow-lg"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center">
          <p className="text-sm text-gray-500">
            Your conversations are private and secure
          </p>
        </footer>
      </div>

      {/* Prompt Editor Dialog */}
      <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chatbot Prompt</DialogTitle>
          </DialogHeader>
          <PromptEditor open={showPromptEditor} onOpenChange={setShowPromptEditor} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
