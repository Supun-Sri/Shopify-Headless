// ─── Pure Calculation Engine for Grouts & Sealants ─────────────────────────

export interface GroutCalculationInput {
  tileLengthMm: number;    // L (mm)
  tileWidthMm: number;     // W (mm)
  tileThicknessMm: number; // T (mm)
  jointWidthMm: number;    // J (mm)
  areaSqm: number;         // A (m²)
  wastePercent?: number;   // e.g. 5 or 10 (%)
  groutDensity?: number;   // default 1.6 kg/dm³ (cementitious) or 1.3 kg/dm³ (epoxy)
  packWeightKg?: number;   // default 5kg, 10kg, or 20kg
}

export interface GroutCalculationResult {
  consumptionKgPerSqm: number; // kg per m²
  netMaterialKg: number;       // total kg before waste
  grossMaterialKg: number;     // total kg including waste
  packsNeeded: number;         // number of bags/packs
  packWeightKg: number;
  wastePercent: number;
}

export interface SealantCalculationInput {
  linearMeters: number;    // m
  jointWidthMm: number;    // mm
  jointDepthMm: number;    // mm
  wastePercent?: number;   // e.g. 5 or 10 (%)
  cartridgeVolumeMl?: number; // default 310 mL
  sausageVolumeMl?: number;   // default 600 mL
}

export interface SealantCalculationResult {
  volumeMlPerMeter: number;   // mL per linear meter
  netVolumeMl: number;        // total mL before waste
  grossVolumeMl: number;      // total mL including waste
  cartridgesNeeded: number;   // standard 310 mL cartridges
  sausagesNeeded: number;     // 600 mL sausage foils
  cartridgeVolumeMl: number;
  sausageVolumeMl: number;
  metersPerCartridge: number; // linear meters yield per cartridge
  wastePercent: number;
}

/**
 * Standard International Formula for Tile Grout Consumption (ISO/EN):
 * Consumption (kg/m²) = ((L + W) * T * J * density) / (L * W)
 */
export function calculateGroutConsumption(
  input: GroutCalculationInput
): GroutCalculationResult {
  const {
    tileLengthMm,
    tileWidthMm,
    tileThicknessMm,
    jointWidthMm,
    areaSqm,
    wastePercent = 5,
    groutDensity = 1.6,
    packWeightKg = 5,
  } = input;

  if (
    tileLengthMm <= 0 ||
    tileWidthMm <= 0 ||
    tileThicknessMm <= 0 ||
    jointWidthMm <= 0 ||
    areaSqm <= 0
  ) {
    return {
      consumptionKgPerSqm: 0,
      netMaterialKg: 0,
      grossMaterialKg: 0,
      packsNeeded: 0,
      packWeightKg,
      wastePercent,
    };
  }

  // ((L + W) * T * J * density) / (L * W)
  const numerator =
    (tileLengthMm + tileWidthMm) * tileThicknessMm * jointWidthMm * groutDensity;
  const denominator = tileLengthMm * tileWidthMm;
  const consumptionKgPerSqm = numerator / denominator;

  const netMaterialKg = consumptionKgPerSqm * areaSqm;
  const grossMaterialKg = netMaterialKg * (1 + wastePercent / 100);
  const packsNeeded = Math.max(1, Math.ceil(grossMaterialKg / packWeightKg));

  return {
    consumptionKgPerSqm: Math.round(consumptionKgPerSqm * 1000) / 1000,
    netMaterialKg: Math.round(netMaterialKg * 100) / 100,
    grossMaterialKg: Math.round(grossMaterialKg * 100) / 100,
    packsNeeded,
    packWeightKg,
    wastePercent,
  };
}

/**
 * Helper to recommend standard joint depth based on joint width
 * (Standard construction & sealant engineering guidelines):
 * - For width <= 10mm: depth = width (min 6mm)
 * - For width 10mm-20mm: depth = 10mm (aspect ratio 2:1 to 1:1)
 * - For width > 20mm: depth = width / 2 (aspect ratio 2:1)
 */
export function getSuggestedJointDepth(jointWidthMm: number): number {
  if (jointWidthMm <= 0) return 6;
  if (jointWidthMm <= 6) return 6;
  if (jointWidthMm <= 10) return jointWidthMm;
  if (jointWidthMm <= 20) return 10;
  return Math.round(jointWidthMm / 2);
}

/**
 * Standard Sealant Consumption Formula:
 * Volume per meter (mL/m) = Joint Width (mm) * Joint Depth (mm)
 * Total Volume (mL) = Volume per meter * Linear Meters * (1 + Waste%)
 */
export function calculateSealantConsumption(
  input: SealantCalculationInput
): SealantCalculationResult {
  const {
    linearMeters,
    jointWidthMm,
    jointDepthMm,
    wastePercent = 10,
    cartridgeVolumeMl = 310,
    sausageVolumeMl = 600,
  } = input;

  if (linearMeters <= 0 || jointWidthMm <= 0 || jointDepthMm <= 0) {
    return {
      volumeMlPerMeter: 0,
      netVolumeMl: 0,
      grossVolumeMl: 0,
      cartridgesNeeded: 0,
      sausagesNeeded: 0,
      cartridgeVolumeMl,
      sausageVolumeMl,
      metersPerCartridge: 0,
      wastePercent,
    };
  }

  // 1 mm * 1 mm * 1000 mm = 1000 mm³ = 1 mL
  const volumeMlPerMeter = jointWidthMm * jointDepthMm;
  const netVolumeMl = volumeMlPerMeter * linearMeters;
  const grossVolumeMl = netVolumeMl * (1 + wastePercent / 100);

  const cartridgesNeeded = Math.max(1, Math.ceil(grossVolumeMl / cartridgeVolumeMl));
  const sausagesNeeded = Math.max(1, Math.ceil(grossVolumeMl / sausageVolumeMl));

  const metersPerCartridge =
    volumeMlPerMeter > 0 ? Math.round((cartridgeVolumeMl / volumeMlPerMeter) * 10) / 10 : 0;

  return {
    volumeMlPerMeter: Math.round(volumeMlPerMeter * 10) / 10,
    netVolumeMl: Math.round(netVolumeMl),
    grossVolumeMl: Math.round(grossVolumeMl),
    cartridgesNeeded,
    sausagesNeeded,
    cartridgeVolumeMl,
    sausageVolumeMl,
    metersPerCartridge,
    wastePercent,
  };
}
