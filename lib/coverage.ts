import type { ShopifyProduct } from './types';

export interface CoverageRateOption {
  value: string;
  label: string;
  rate: number;
}

export interface ProductCoverageInfo {
  defaultRate: string;
  unitSingular: string;
  unitPlural: string;
  options: CoverageRateOption[];
  detectedKeyword?: string;
  sourceNote?: string;
}

/**
 * Intelligently extracts or infers the product's coverage rate, unit name,
 * and standard application options from product title, tags, and description.
 */
export function getProductCoverageInfo(product: ShopifyProduct): ProductCoverageInfo {
  const text = `${product.title} ${product.tags.join(' ')} ${product.description || ''}`.toLowerCase();

  // 1. Try to find explicit numbers in description or tags
  // Examples: "coverage: 5 sqm", "coverage approx 4.5 m2", "5sqm per bag"
  const explicitMatch =
    text.match(/coverage[:\s]+(?:approx\.?|~)?\s*(\d+(?:\.\d+)?)\s*(?:sqm|m²|m2|sq\.?m)/) ||
    text.match(/(\d+(?:\.\d+)?)\s*(?:sqm|m²|m2|sq\.?m)\s*(?:per|\/)\s*(?:bag|unit|canister|drum|liter|l|bucket|pail|cartridge)/) ||
    text.match(/coverage[-_:](\d+(?:\.\d+)?)/);

  const explicitRate = explicitMatch ? parseFloat(explicitMatch[1]) : null;

  // 2. Classify product type to determine units and realistic construction rates
  const isTileAdhesive =
    text.includes('adhesive') || text.includes('tile') || text.includes('thin-set') || text.includes('thinset');
  const isMortarOrGrout =
    text.includes('mortar') || text.includes('grout') || text.includes('repair') || text.includes('screed') || text.includes('render');
  const isCoatingOrWaterproofing =
    text.includes('coating') || text.includes('waterproof') || text.includes('membrane') || text.includes('elastomeric') || text.includes('paint');
  const isLiquidHardener =
    text.includes('hardener') || text.includes('dustproof') || text.includes('densifier') || text.includes('silicate');
  const isBondingAgent =
    text.includes('bonding') || text.includes('sbr') || text.includes('primer');
  const isSealant =
    text.includes('sealant') || text.includes('silicone') || text.includes('filler') || text.includes('polyurethane joint') || text.includes('mastic');

  if (isTileAdhesive) {
    const defaultRate = explicitRate ? explicitRate.toString() : '5';
    return {
      defaultRate,
      unitSingular: 'bag',
      unitPlural: 'bags',
      detectedKeyword: 'Tile Adhesive',
      sourceNote: explicitRate ? 'From technical specification' : 'Standard 20kg/25kg bag',
      options: [
        { value: '4', label: '~4 sqm / bag (Large format tile / 10-12mm trowel)', rate: 4 },
        { value: defaultRate, label: `~${defaultRate} sqm / bag (Standard tile / 6-8mm trowel — Recommended)`, rate: parseFloat(defaultRate) },
        { value: '6', label: '~6 sqm / bag (Small mosaic / 4mm trowel)', rate: 6 },
      ],
    };
  }

  if (isMortarOrGrout) {
    const defaultRate = explicitRate ? explicitRate.toString() : '2.5';
    return {
      defaultRate,
      unitSingular: 'bag',
      unitPlural: 'bags',
      detectedKeyword: 'Mortar / Grout',
      sourceNote: explicitRate ? 'From technical specification' : 'Structural mortar/grout',
      options: [
        { value: '2', label: '~2 sqm / bag (Heavy structural layer ~20mm)', rate: 2 },
        { value: defaultRate, label: `~${defaultRate} sqm / bag (Standard repair ~12mm — Recommended)`, rate: parseFloat(defaultRate) },
        { value: '3.5', label: '~3.5 sqm / bag (Thin leveling coat ~6mm)', rate: 3.5 },
      ],
    };
  }

  if (isCoatingOrWaterproofing) {
    const defaultRate = explicitRate ? explicitRate.toString() : '6';
    return {
      defaultRate,
      unitSingular: 'unit',
      unitPlural: 'units',
      detectedKeyword: 'Coating / Waterproofing',
      sourceNote: explicitRate ? 'From technical specification' : 'Protective coating',
      options: [
        { value: '4', label: '~4 sqm / unit (Heavy 2-coat waterproof membrane)', rate: 4 },
        { value: defaultRate, label: `~${defaultRate} sqm / unit (Standard 2-coat application — Recommended)`, rate: parseFloat(defaultRate) },
        { value: '8', label: '~8 sqm / unit (Single protective top coat)', rate: 8 },
      ],
    };
  }

  if (isLiquidHardener) {
    const defaultRate = explicitRate ? explicitRate.toString() : '8';
    return {
      defaultRate,
      unitSingular: 'canister',
      unitPlural: 'canisters',
      detectedKeyword: 'Liquid Hardener',
      sourceNote: explicitRate ? 'From technical specification' : 'Concrete densifier',
      options: [
        { value: '6', label: '~6 sqm / canister (Porous / rough concrete floor)', rate: 6 },
        { value: defaultRate, label: `~${defaultRate} sqm / canister (Standard troweled slab — Recommended)`, rate: parseFloat(defaultRate) },
        { value: '10', label: '~10 sqm / canister (Dense / smooth power-floated concrete)', rate: 10 },
      ],
    };
  }

  if (isBondingAgent) {
    const defaultRate = explicitRate ? explicitRate.toString() : '7';
    return {
      defaultRate,
      unitSingular: 'canister',
      unitPlural: 'canisters',
      detectedKeyword: 'Bonding Agent',
      sourceNote: explicitRate ? 'From technical specification' : 'Bonding primer',
      options: [
        { value: '5', label: '~5 sqm / canister (Bonding slurry coat)', rate: 5 },
        { value: defaultRate, label: `~${defaultRate} sqm / canister (Standard adhesion primer — Recommended)`, rate: parseFloat(defaultRate) },
        { value: '9', label: '~9 sqm / canister (Diluted dustproofer / mist coat)', rate: 9 },
      ],
    };
  }

  if (isSealant) {
    const defaultRate = explicitRate ? explicitRate.toString() : '3.5';
    return {
      defaultRate,
      unitSingular: 'cartridge',
      unitPlural: 'cartridges',
      detectedKeyword: 'Joint Sealant',
      sourceNote: explicitRate ? 'From technical specification' : 'Joint sealant cartridge',
      options: [
        { value: '2.5', label: '~2.5 sqm / cartridge (Deep / wide joints ~15-20mm)', rate: 2.5 },
        { value: defaultRate, label: `~${defaultRate} sqm / cartridge (Standard 10x10mm joints — Recommended)`, rate: parseFloat(defaultRate) },
        { value: '5', label: '~5 sqm / cartridge (Narrow perimeter joints ~5mm)', rate: 5 },
      ],
    };
  }

  // Fallback generic
  const defaultRate = explicitRate ? explicitRate.toString() : '5';
  return {
    defaultRate,
    unitSingular: 'unit',
    unitPlural: 'units',
    sourceNote: 'Standard manufacturer estimate',
    options: [
      { value: '4', label: '~4 sqm / unit (Heavy application)', rate: 4 },
      { value: defaultRate, label: `~${defaultRate} sqm / unit (Recommended coverage)`, rate: parseFloat(defaultRate) },
      { value: '6', label: '~6 sqm / unit (Standard application)', rate: 6 },
      { value: '8', label: '~8 sqm / unit (Light application)', rate: 8 },
    ],
  };
}
