import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Briefcase, Brain, BatteryLow, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import LandingPageHeader from '@/components/landing/LandingPageHeader';
import { usePageView } from '@/hooks/usePageView';

const PAGE_SLUG = 'work-stress';

const PLACEHOLDER_PROMPTS = [
  "I'm constantly overwhelmed and can't keep up with my workload...",
  "My boss creates a toxic environment and I dread going in...",
  "I can't stop checking emails after hours and it's ruining my life...",
  "I feel burned out and have lost all motivation for my career...",
  "Work anxiety is giving me physical symptoms like chest tightness...",
  "I was passed over for promotion and I'm spiraling...",
  "I can't separate work stress from my personal relationships...",
  "I'm thinking of quitting but the fear of change is paralyzing...",
];

const WorkStressLandingPage = () => {
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
      {/* Professional gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-emerald-200/15 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <LandingPageHeader
          icon={Briefcase}
          label="Work & Stress"
          pageSlug={PAGE_SLUG}
          theme="light"
          iconBgClass="bg-gradient-to-br from-teal-500 to-cyan-600"
          labelClass="text-teal-600"
          signupBtnClass="bg-teal-600 hover:bg-teal-700 text-white"
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 border border-teal-200 mb-6">
              <Brain className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-teal-700">Work Stress Support</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-gray-800 mb-6 leading-tight tracking-tight">
              Take Back Control
              <br />
              <span className="italic text-teal-600">From Burnout</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Work stress doesn't have to define your life. Share what you're dealing with, and we'll match you with a therapist who specializes in workplace wellness and burnout recovery.
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
                    placeholder={displayedPlaceholder || "Tell us about your work stress..."}
                    className="min-h-[120px] resize-none border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 pr-14"
                    style={{ fontSize: '17px', lineHeight: '1.6' }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    size="icon"
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/25"
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
              { icon: BatteryLow, label: "Burnout", prompt: "I feel completely burned out and have no energy left for anything" },
              { icon: ShieldAlert, label: "Toxic Workplace", prompt: "My work environment is toxic and it's affecting my mental health" },
              { icon: Brain, label: "Work-Life Balance", prompt: "I can't stop thinking about work and it's ruining my personal life" },
            ].map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => {
                  setInput(prompt);
                  textareaRef.current?.focus();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-all text-left group"
              >
                <Icon className="h-5 w-5 text-teal-500 flex-shrink-0 group-hover:text-teal-600" />
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

export default WorkStressLandingPage;
