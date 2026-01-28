'use client';

import { type Edition } from '@opencalc/feature-flags';

interface EditionSwitcherProps {
  currentEdition: Edition;
  className?: string;
}

const editions: { id: Edition; name: string; port: number; description: string }[] = [
  {
    id: 'SBO',
    name: 'SBO Edition',
    port: 3002,
    description: 'Small Business Owner',
  },
  {
    id: 'EXTENDED',
    name: 'Extended Edition',
    port: 3003,
    description: 'BIM & Kengetallen',
  },
  {
    id: 'ESTIMATOR',
    name: 'Estimator Pro',
    port: 3004,
    description: 'Enterprise Features',
  },
];

/**
 * Edition switcher component for development
 * Allows quick switching between different OpenCalc editions
 */
export function EditionSwitcher({ currentEdition, className }: EditionSwitcherProps) {
  const handleSwitch = (port: number) => {
    // Preserve the current path when switching editions
    const currentPath = window.location.pathname;
    window.location.href = `http://localhost:${port}${currentPath}`;
  };

  return (
    <div className={`p-3 border-t ${className || ''}`}>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Edition Switcher (Dev)
      </div>
      <div className="space-y-1">
        {editions.map((edition) => (
          <button
            key={edition.id}
            onClick={() => handleSwitch(edition.port)}
            disabled={edition.id === currentEdition}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              edition.id === currentEdition
                ? 'bg-primary/10 text-primary font-medium cursor-default'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="font-medium">{edition.name}</div>
            <div className="text-xs text-gray-500">{edition.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
