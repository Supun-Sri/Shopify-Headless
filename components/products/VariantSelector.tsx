'use client';

import type { ShopifyVariant } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  variants: ShopifyVariant[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
}

export default function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  // Group variants by option name
  const optionGroups = variants.reduce<
    Record<string, { name: string; values: { value: string; variantId: string; available: boolean }[] }>
  >((groups, variant) => {
    variant.selectedOptions.forEach((option) => {
      if (!groups[option.name]) {
        groups[option.name] = { name: option.name, values: [] };
      }

      const existing = groups[option.name].values.find(
        (v) => v.value === option.value
      );

      if (!existing) {
        groups[option.name].values.push({
          value: option.value,
          variantId: variant.id,
          available: variant.availableForSale,
        });
      }
    });
    return groups;
  }, {});

  // If only one variant with "Default Title", don't show selector
  if (
    variants.length === 1 &&
    variants[0].title === 'Default Title'
  ) {
    return null;
  }

  return (
    <div className="variant-selector">
      {Object.values(optionGroups).map((group) => (
        <div key={group.name} className="variant-group">
          <div className="variant-group-header">
            <span className="variant-label">
              Select {group.name}
            </span>
          </div>
          <div className="variant-options">
            {group.values.map((option) => {
              const isSelected = option.variantId === selectedVariantId;
              return (
                <button
                  key={option.value}
                  onClick={() => onSelect(option.variantId)}
                  disabled={!option.available}
                  className={cn(
                    'variant-btn',
                    isSelected && 'variant-btn-active',
                    !option.available && 'variant-btn-disabled'
                  )}
                  aria-pressed={isSelected}
                  id={`variant-${group.name}-${option.value}`}
                >
                  {option.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
