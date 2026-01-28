'use client';

import { type ReactNode } from 'react';
import { type EditionFeatures } from '@opencalc/feature-flags';

interface FeatureGateProps {
  feature: keyof EditionFeatures;
  hasFeature: (feature: keyof EditionFeatures) => boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on feature availability
 */
export function FeatureGate({
  feature,
  hasFeature,
  children,
  fallback = null,
}: FeatureGateProps) {
  if (!hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface UpgradePromptProps {
  feature: string;
  currentEdition: string;
  requiredEdition: string;
  className?: string;
}

/**
 * Display an upgrade prompt when a feature is not available
 */
export function UpgradePrompt({
  feature,
  currentEdition,
  requiredEdition,
  className,
}: UpgradePromptProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center ${className || ''}`}
    >
      <div className="text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">
          {feature} is niet beschikbaar in {currentEdition}
        </p>
        <p>
          Upgrade naar <span className="font-semibold">{requiredEdition}</span> om
          deze functie te gebruiken.
        </p>
      </div>
    </div>
  );
}
