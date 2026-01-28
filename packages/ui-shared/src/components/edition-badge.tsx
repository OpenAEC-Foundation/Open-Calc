'use client';

import { cn } from '../lib/utils';

export type EditionType = 'SBO' | 'EXTENDED' | 'ESTIMATOR';

interface EditionBadgeProps {
  edition: EditionType;
  className?: string;
}

const editionConfig: Record<EditionType, { label: string; color: string }> = {
  SBO: {
    label: 'SBO',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  EXTENDED: {
    label: 'Extended',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  ESTIMATOR: {
    label: 'Estimator Pro',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

export function EditionBadge({ edition, className }: EditionBadgeProps) {
  const config = editionConfig[edition];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
