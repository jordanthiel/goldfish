import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmailCaptureVariant } from '@/utils/abTest';
import { waitlistService } from '@/services/waitlistService';
import { trackEvent } from '@/services/analyticsService';
import { trackMetaCustom } from '@/services/metaPixelService';

const VARIANT_CONFIG = {
  A: {
    title: 'Almost there',
    prompt:
      "Great — based on what you've shared, we think we can find a strong match for you. What's the best email to send it to?",
    cta: 'Send me my match',
  },
  B: {
    title: 'Join the waitlist',
    prompt:
      "We're currently oversubscribed — our matching team is working through a waitlist. Leave your name and email and we'll reach out as soon as we have a match ready for you.",
    cta: 'Join the waitlist',
  },
} as const;

export interface EmailCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: EmailCaptureVariant;
  conversationId: string | null;
  pageSlug?: string;
}

export const EmailCaptureDialog: React.FC<EmailCaptureDialogProps> = ({
  open,
  onOpenChange,
  variant,
  conversationId,
  pageSlug,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      trackEvent('email_capture_submitted', {
        conversationId,
        pageSlug,
        variant,
      });
      trackMetaCustom('email_captured');
      onOpenChange(false);
      const q = pageSlug ? `?page=${encodeURIComponent(pageSlug)}` : '';
      navigate(`/thanks${q}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription className="text-left text-gray-600 pt-1">
            {config.prompt}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            className="text-sm"
            autoComplete="name"
          />
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="text-sm"
            autoComplete="email"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !email.trim()}
            className="bg-therapy-purple hover:bg-therapy-purple/90 w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>{config.cta} &rarr;</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
