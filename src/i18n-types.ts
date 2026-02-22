export interface Translations {
  appTagline: string;
  languageLabel: string;
  languagePolish: string;
  languageEnglish: string;
  languageGerman: string;
  languageChinese: string;

  palletDimensions: string;
  palletLength: string;
  palletWidth: string;
  palletMaxHeight: string;
  palletMaxWeight: string;
  palletPackingStyle: string;
  packingStyleCenterCompact: string;
  packingStyleEdgeAligned: string;

  addCartonType: string;
  editCartonType: string;
  cartonName: string;
  cartonLength: string;
  cartonWidth: string;
  cartonHeight: string;
  cartonWeight: string;
  cartonQuantity: string;
  cartonColor: string;
  cartonAllowUpright: string;
  cartonUprightNever: string;
  cartonUprightTailOnly: string;
  cartonUprightPrefer: string;
  cartonNamePlaceholder: string;
  defaultCartonName: string;
  untitledCarton: string;
  addCartons: string;
  updateCarton: string;
  cancel: string;

  infoBannerTitle: string;
  infoBannerLine1: string;
  infoBannerLine2: string;
  infoBannerLine3: string;

  cartonsWithCount: (count: number) => string;
  edit: string;
  remove: string;
  calculatePacking: string;

  layers: string;
  allLayers: (count: number) => string;
  upToLayer: (layer: number) => string;

  stats: string;
  diagnostics: string;
  showDiagnostics: string;
  hideDiagnostics: string;
  requestedUnits: string;
  packedUnits: string;
  overlapCount: string;
  boundsViolations: string;
  hardChecks: string;
  checksOk: string;
  checksIssues: string;
  weight: string;
  height: string;
  layerCount: string;
  unpacked: (count: number) => string;
  unpackedLimitExceeded?: (count: number) => string;
  windowResolution?: string;
}

export const OPTIONAL_TRANSLATION_KEYS = ["unpackedLimitExceeded", "windowResolution"] as const;
