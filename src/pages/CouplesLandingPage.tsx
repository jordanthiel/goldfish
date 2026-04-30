import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Heart, HeartHandshake, MessageCircleHeart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import LandingPageHeader from '@/components/landing/LandingPageHeader';
import { usePageView } from '@/hooks/usePageView';

const PAGE_SLUG = 'couples';

const PLACEHOLDER_PROMPTS = [
  "We keep having the same argument over and over again...",
  "We've grown apart and don't know how to reconnect...",
  "Trust was broken and we're trying to rebuild it...",
  "We disagree on big life decisions like kids and finances...",
  "Communication has completely broken down between us...",
  "We love each other but can't stop hurting each other...",
  "One of us wants therapy but the other is resistant...",
  "We're going through a rough patch after a major life change...",
];

const CouplesLandingPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  usePageView(PAGE_SLUG);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl" />

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5C22 5 15 12 15 20c0 12 15 25 15 25s15-13 15-25C45 12 38 5 30 5z' fill='%23e11d48' fill-opacity='0.3'/%3E%3C/svg%3E")`,
      }} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <LandingPageHeader
          label="Couples"
          pageSlug={PAGE_SLUG}
          theme="light"
          labelClass="text-rose-500"
          signupBtnClass="bg-rose-500 hover:bg-rose-600 text-white"
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 border border-rose-200 mb-6">
              <Heart className="h-4 w-4 text-rose-500" />
              <span className="text-sm text-rose-600">Couples Therapy</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-gray-800 mb-6 leading-tight tracking-tight">
              Strengthen Your
              <br />
              <span className="italic text-rose-500">Relationship</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Every relationship has its challenges. Share what you're going through, and we'll connect you with a couples therapist who can help you and your partner grow together.
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
                    placeholder={displayedPlaceholder || "Tell us what's happening in your relationship..."}
                    className="min-h-[120px] resize-none border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 pr-14"
                    style={{ fontSize: '17px', lineHeight: '1.6' }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    size="icon"
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/25"
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
              { icon: MessageCircleHeart, label: "Communication", prompt: "We struggle to communicate without it turning into an argument" },
              { icon: HeartHandshake, label: "Trust Issues", prompt: "Trust has been broken in our relationship and we need help rebuilding it" },
              { icon: Users, label: "Growing Apart", prompt: "We feel like we've grown apart and lost our connection" },
            ].map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => {
                  setInput(prompt);
                  textareaRef.current?.focus();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all text-left group"
              >
                <Icon className="h-5 w-5 text-rose-400 flex-shrink-0 group-hover:text-rose-500" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
              </button>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center">
          <p className="text-sm text-gray-400">
            Your conversations are private and secure
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CouplesLandingPage;
