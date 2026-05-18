import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const AnalyticsTruncationBanner: React.FC<{ truncated?: boolean }> = ({
  truncated,
}) => {
  if (!truncated) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 mb-4">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        Results are based on the most recent 20,000 events in this date range. Narrow the
        date range or add filters for complete accuracy on very high volume periods.
      </span>
    </div>
  );
};
