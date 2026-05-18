import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  field: string;
  activeField: string;
  direction: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
};

export const SortableTableHead: React.FC<Props> = ({
  label,
  field,
  activeField,
  direction,
  onSort,
  className,
}) => {
  const active = activeField === field;
  return (
    <TableHead className={cn('cursor-pointer select-none', className)}>
      <button
        type="button"
        className="flex items-center gap-1 font-medium hover:text-therapy-purple"
        onClick={() => onSort(field)}
      >
        {label}
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />
        )}
      </button>
    </TableHead>
  );
};
