'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface VatState {
  isVatInclusive: boolean;
  vatRate: number; // e.g. 0.05 for 5%
  setVatInclusive: (inclusive: boolean) => void;
  setVatRate: (rate: number) => void;
}

export const useVatStore = create<VatState>()(
  persist(
    (set) => ({
      isVatInclusive: true, // Default in UAE
      vatRate: 0.05, // Default UAE VAT rate
      setVatInclusive: (inclusive) => set({ isVatInclusive: inclusive }),
      setVatRate: (rate) => set({ vatRate: rate }),
    }),
    {
      name: 'imperial-vat-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
