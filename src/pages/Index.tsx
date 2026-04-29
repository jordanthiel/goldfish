import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import LandingPageHeader from '@/components/landing/LandingPageHeader';
import { HowItWorksSection } from '@/components/landing/HowItWorks';
import { usePageView } from '@/hooks/usePageView';
import {
  getLandingHeroVersion,
  LANDING_HERO_COPY,
} from '@/utils/landingUtmContent';

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

const PAGE_SLUG = 'default';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  usePageView(PAGE_SLUG);

  const hero = useMemo(() => {
    const version = getLandingHeroVersion(searchParams.get('utm_content'));
    return LANDING_HERO_COPY[version];
  }, [searchParams]);
  
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

    const next = new URLSearchParams(searchParams);
    next.set('message', input.trim());
    next.set('page', PAGE_SLUG);
    navigate(`/chat?${next.toString()}`);
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
        <LandingPageHeader
          icon={Sparkles}
          pageSlug={PAGE_SLUG}
          theme="light"
          iconBgClass="bg-gradient-to-br from-therapy-purple to-therapy-pink"
          signupBtnClass="bg-therapy-purple hover:bg-therapy-purple/90"
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32 pt-8 sm:pt-12">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h1 className="text-[1.625rem] sm:text-4xl lg:text-[2.65rem] font-serif font-light text-gray-800 mb-6 leading-[1.2] tracking-tight">
              {hero.headline}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {hero.subtext}
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

          <div className="w-full mt-12 mb-10">
            <HowItWorksSection />
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center">
          <p className="text-sm text-gray-500">
            Your conversations are private and secure
          </p>
        </footer>
      </div>

    </div>
  );
};

export default Index;
