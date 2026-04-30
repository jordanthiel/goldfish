import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Moon, CloudMoon, BedDouble, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import LandingPageHeader from '@/components/landing/LandingPageHeader';
import { usePageView } from '@/hooks/usePageView';

const PAGE_SLUG = 'sleep';

const PLACEHOLDER_PROMPTS = [
  "I can't fall asleep no matter how tired I am...",
  "I keep waking up at 3am and can't go back to sleep...",
  "My racing thoughts won't let me rest at night...",
  "I've been relying on sleep aids and want to stop...",
  "My partner says I snore and stop breathing at night...",
  "I sleep 8 hours but still feel exhausted every morning...",
  "Stress from work is destroying my sleep schedule...",
  "I have vivid nightmares that wake me up in a panic...",
];

const SleepLandingPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  usePageView(PAGE_SLUG);

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
      const typeChar = () => {
        if (charIndex <= currentPrompt.length) {
          setDisplayedPlaceholder(currentPrompt.slice(0, charIndex));
          charIndex++;
          timeoutId = setTimeout(typeChar, 40);
        } else {
          timeoutId = setTimeout(() => setIsTyping(false), 2000);
        }
      };
      typeChar();
    } else {
      let deleteIndex = currentPrompt.length;
      const deleteChar = () => {
        if (deleteIndex >= 0) {
          setDisplayedPlaceholder(currentPrompt.slice(0, deleteIndex));
          deleteIndex--;
          timeoutId = setTimeout(deleteChar, 20);
        } else {
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
    const encodedMessage = encodeURIComponent(input.trim());
    navigate(`/chat?message=${encodedMessage}&page=${PAGE_SLUG}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark gradient background - night sky feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950" />

      {/* Subtle star-like dots */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 90px 40px, white, transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
          radial-gradient(2px 2px at 160px 30px, white, transparent)`,
        backgroundSize: '200px 100px',
      }} />

      {/* Decorative glow elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <LandingPageHeader
          label="Sleep"
          pageSlug={PAGE_SLUG}
          theme="dark"
          labelClass="text-blue-300"
          signupBtnClass="bg-blue-500 hover:bg-blue-600 text-white"
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 mb-6">
              <CloudMoon className="h-4 w-4 text-blue-300" />
              <span className="text-sm text-blue-300">Sleep Assessment</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-white mb-6 leading-tight tracking-tight">
              Struggling to Get
              <br />
              <span className="italic text-blue-300">Restful Sleep?</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-200/80 max-w-2xl mx-auto leading-relaxed">
              Tell us about your sleep challenges. Our AI will help identify patterns and connect you with a sleep specialist or therapist who can help you finally rest.
            </p>
          </div>

          {/* Chat input card */}
          <div className="w-full max-w-2xl">
            <Card className="bg-white/5 backdrop-blur-md shadow-2xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={displayedPlaceholder || "Describe your sleep concerns..."}
                    className="min-h-[120px] resize-none border-0 bg-transparent text-lg text-white placeholder:text-blue-300/50 focus-visible:ring-0 focus-visible:ring-offset-0 pr-14"
                    style={{ fontSize: '17px', lineHeight: '1.6' }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    size="icon"
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick-start cards */}
          <div className="w-full max-w-2xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: BedDouble, label: "Insomnia", prompt: "I have trouble falling asleep and staying asleep at night" },
              { icon: Clock, label: "Sleep Schedule", prompt: "My sleep schedule is completely off and I can't fix it" },
              { icon: Moon, label: "Nightmares", prompt: "I keep having disturbing dreams that affect my sleep quality" },
            ].map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => {
                  setInput(prompt);
                  textareaRef.current?.focus();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group"
              >
                <Icon className="h-5 w-5 text-blue-400 flex-shrink-0 group-hover:text-blue-300" />
                <span className="text-sm text-blue-200 group-hover:text-white">{label}</span>
              </button>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center">
          <p className="text-sm text-blue-400/50">
            Your conversations are private and secure
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SleepLandingPage;
