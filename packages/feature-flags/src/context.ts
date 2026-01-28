'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  type Edition,
  type EditionFeatures,
  getEditionFeatures,
  hasFeature,
  getEditionDisplayName,
  getEditionDescription,
} from './editions';

export interface FeatureFlagsContextValue {
  edition: Edition;
  features: EditionFeatures;
  hasFeature: (feature: keyof EditionFeatures) => boolean;
  displayName: string;
  description: string;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

interface FeatureFlagsProviderProps {
  edition: Edition;
  children: ReactNode;
}

export function FeatureFlagsProvider({ edition, children }: FeatureFlagsProviderProps) {
  const value: FeatureFlagsContextValue = {
    edition,
    features: getEditionFeatures(edition),
    hasFeature: (feature) => hasFeature(edition, feature),
    displayName: getEditionDisplayName(edition),
    description: getEditionDescription(edition),
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);

  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }

  return context;
}
