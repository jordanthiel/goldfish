import React, { useState } from 'react';
import { Loader2, Bot, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EmailCaptureVariant } from '@/utils/abTest';
import { waitlistService } from '@/services/waitlistService';
import { trackEvent } from '@/services/analyticsService';

interface EmailCaptureFormProps {
  variant: EmailCaptureVariant;
  conversationId: string | null;
  pageSlug?: string;
}

const VARIANT_CONFIG = {
  A: {
    prompt:
      "Great — based on what you've shared, we think we can find a strong match for you. What's the best email to send it to?",
    cta: 'Send me my match',
    confirmation:
      "You're on our list. We're hand-picking matches right now and will be in touch within 48 hours.",
  },
  B: {
    prompt:
      "We're currently oversubscribed — our matching team is working through a waitlist. Leave your name and email and we'll reach out as soon as we have a match ready for you.",
    cta: 'Join the waitlist',
    confirmation:
      "You're on our list. We're hand-picking matches right now and will be in touch within 48 hours.",
  },
} as const;

export const EmailCaptureForm: React.FC<EmailCaptureFormProps> = ({
  variant,
  conversationId,
  pageSlug,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const config = VARIANT_CONFIG[variant];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    const success = await waitlistService.submit({
      name: name.trim(),
      email: email.trim(),
      variant,
      conversationId,
      pageSlug,
    });

    setIsSubmitting(false);
    if (success) {
      setIsSubmitted(true);
      trackEvent('email_capture_submitted', {
        conversationId,
        pageSlug,
        variant,
      });
    }
  };

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>

      <Card className="max-w-[80%] bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="p-4">
          {isSubmitted ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">
                {config.confirmation}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                {config.prompt}
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="flex-1 text-sm"
                />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="flex-1 text-sm"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !email.trim()}
                  className="bg-therapy-purple hover:bg-therapy-purple/90 whitespace-nowrap text-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>{config.cta} &rarr;</>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
