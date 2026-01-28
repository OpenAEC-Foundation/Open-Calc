/**
 * OpenCalc Edition Definitions
 *
 * Three editions targeting different market segments:
 * - SBO: Small Business Owner (ZZP/kleine aannemers)
 * - Extended: Mid-market (adviesbureaus, architecten)
 * - Estimator: Enterprise (grote bouwbedrijven)
 */

export type Edition = 'SBO' | 'EXTENDED' | 'ESTIMATOR';

export interface EditionFeatures {
  // Project Limits
  maxProjects: number;
  maxEstimatesPerProject: number;
  maxLibraries: number;

  // Core Features
  projectManagement: boolean;
  basicEstimating: boolean;
  pdfExport: boolean;
  excelExport: boolean;

  // Extended Features (BIM & Kengetallen)
  gridEditor: boolean;
  bimImport: boolean;
  kengetallen: boolean;
  hybridCalculation: boolean;
  shapeFactors: boolean;
  departmentFactors: boolean;
  indexering: boolean;
  nlSfbClassification: boolean;
  progressVisualization: boolean;

  // Estimator Features (Enterprise)
  werkbegroting: boolean;
  nacalculatie: boolean;
  mamoStructure: boolean;
  onderaannemers: boolean;
  meerwerk: boolean;
  bewakingscodes: boolean;
  risicoAnalyse: boolean;
  cufExport: boolean;
  erpIntegration: boolean;
  multiUser: boolean;
  auditTrail: boolean;
  apiAccess: boolean;
}

export const EDITION_FEATURES: Record<Edition, EditionFeatures> = {
  SBO: {
    // Project Limits - Unlimited
    maxProjects: Infinity,
    maxEstimatesPerProject: Infinity,
    maxLibraries: Infinity,

    // Core Features - All enabled
    projectManagement: true,
    basicEstimating: true,
    pdfExport: true,
    excelExport: true,

    // Extended Features - Disabled
    gridEditor: false,
    bimImport: false,
    kengetallen: false,
    hybridCalculation: false,
    shapeFactors: false,
    departmentFactors: false,
    indexering: false,
    nlSfbClassification: false,
    progressVisualization: false,

    // Estimator Features - Disabled
    werkbegroting: false,
    nacalculatie: false,
    mamoStructure: false,
    onderaannemers: false,
    meerwerk: false,
    bewakingscodes: false,
    risicoAnalyse: false,
    cufExport: false,
    erpIntegration: false,
    multiUser: false,
    auditTrail: false,
    apiAccess: false,
  },

  EXTENDED: {
    // Project Limits - Unlimited
    maxProjects: Infinity,
    maxEstimatesPerProject: Infinity,
    maxLibraries: Infinity,

    // Core Features - All enabled
    projectManagement: true,
    basicEstimating: true,
    pdfExport: true,
    excelExport: true,

    // Extended Features - All enabled
    gridEditor: true,
    bimImport: true,
    kengetallen: true,
    hybridCalculation: true,
    shapeFactors: true,
    departmentFactors: true,
    indexering: true,
    nlSfbClassification: true,
    progressVisualization: true,

    // Estimator Features - Disabled
    werkbegroting: false,
    nacalculatie: false,
    mamoStructure: false,
    onderaannemers: false,
    meerwerk: false,
    bewakingscodes: false,
    risicoAnalyse: false,
    cufExport: false,
    erpIntegration: false,
    multiUser: false,
    auditTrail: false,
    apiAccess: false,
  },

  ESTIMATOR: {
    // Project Limits - Unlimited
    maxProjects: Infinity,
    maxEstimatesPerProject: Infinity,
    maxLibraries: Infinity,

    // Core Features - All enabled
    projectManagement: true,
    basicEstimating: true,
    pdfExport: true,
    excelExport: true,

    // Extended Features - All enabled
    gridEditor: true,
    bimImport: true,
    kengetallen: true,
    hybridCalculation: true,
    shapeFactors: true,
    departmentFactors: true,
    indexering: true,
    nlSfbClassification: true,
    progressVisualization: true,

    // Estimator Features - All enabled
    werkbegroting: true,
    nacalculatie: true,
    mamoStructure: true,
    onderaannemers: true,
    meerwerk: true,
    bewakingscodes: true,
    risicoAnalyse: true,
    cufExport: true,
    erpIntegration: true,
    multiUser: true,
    auditTrail: true,
    apiAccess: true,
  },
};

/**
 * Get features for a specific edition
 */
export function getEditionFeatures(edition: Edition): EditionFeatures {
  return EDITION_FEATURES[edition];
}

/**
 * Check if a specific feature is enabled for an edition
 */
export function hasFeature(edition: Edition, feature: keyof EditionFeatures): boolean {
  const features = EDITION_FEATURES[edition];
  const value = features[feature];

  if (typeof value === 'boolean') {
    return value;
  }

  // For numeric limits, return true if > 0
  return value > 0;
}

/**
 * Get the display name for an edition
 */
export function getEditionDisplayName(edition: Edition): string {
  const names: Record<Edition, string> = {
    SBO: 'Small Business Owner',
    EXTENDED: 'Extended',
    ESTIMATOR: 'Estimator Pro',
  };
  return names[edition];
}

/**
 * Get the description for an edition
 */
export function getEditionDescription(edition: Edition): string {
  const descriptions: Record<Edition, string> = {
    SBO: 'Voor ZZP\'ers en kleine aannemers - eenvoudig en efficiënt calculeren',
    EXTENDED: 'Voor adviesbureaus en architecten - met BIM-integratie en kengetallen',
    ESTIMATOR: 'Voor grote bouwbedrijven - complete werkbegroting en nacalculatie',
  };
  return descriptions[edition];
}
