'use client';

import { useState, useEffect } from 'react';
import { useVatStore } from './vat-store';
import type { Money } from './types';

/**
 * A React hook that returns formatted price strings based on the global VAT toggle.
 * It assumes the base price provided from Shopify is VAT Inclusive.
 */
export function usePrice() {
  const { isVatInclusive, vatRate } = useVatStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatWithVat = (money: Money) => {
    const baseAmount = parseFloat(money.amount);
    
    // If Shopify prices are inclusive of VAT, and the user wants EXCLUSIVE, we divide by (1 + vatRate)
    // If Shopify prices are inclusive of VAT, and user wants INCLUSIVE, we do nothing to the base.
    const finalAmount = isVatInclusive ? baseAmount : baseAmount / (1 + vatRate);

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(finalAmount);

    // To prevent hydration mismatches, default to the inclusive price before mounting
    if (!mounted) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: money.currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(baseAmount);
    }

    return formatted;
  };

  return { formatWithVat, isVatInclusive, vatRate };
}
