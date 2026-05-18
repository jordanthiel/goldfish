import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  EMAIL_CAPTURE_VARIANT_LABELS,
  type EmailCaptureVariantCode,
} from '@/utils/emailCaptureVariantLabels';
import { cn } from '@/lib/utils';

type Props = {
  variant: string | null | undefined;
  showName?: boolean;
  className?: string;
};

export const VariantBadge: React.FC<Props> = ({
  variant,
  showName = true,
  className,
}) => {
  if (variant !== 'A' && variant !== 'B') {
    return (
      <Badge variant="outline" className={cn('text-gray-400 border-gray-200', className)}>
        Unknown
      </Badge>
    );
  }

  const code = variant as EmailCaptureVariantCode;
  const meta = EMAIL_CAPTURE_VARIANT_LABELS[code];
  const isA = code === 'A';

  return (
    <Badge
      className={cn(
        'font-mono font-semibold border',
        isA
          ? 'bg-purple-100 text-therapy-purple border-purple-200'
          : 'bg-pink-100 text-therapy-pink border-pink-200',
        className,
      )}
      title={meta.description}
    >
      {showName ? `${meta.short} · ${meta.name}` : meta.short}
    </Badge>
  );
};
