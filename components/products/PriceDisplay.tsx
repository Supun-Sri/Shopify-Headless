import type { Money } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface PriceDisplayProps {
  money: Money;
  className?: string;
}

export default function PriceDisplay({ money, className = '' }: PriceDisplayProps) {
  return (
    <p className={`price-display ${className}`}>
      {formatPrice(money)}
    </p>
  );
}
