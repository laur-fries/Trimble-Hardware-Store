import type { CatalogProduct } from '../catalogData';
import { parsePrice } from '../catalogData';
import type { CartLine } from './CartContext';
import { getLineUnitPrice } from './bomHelpers';

/**
 * Demo dealer-net drift keyed by part number (signed: + increase, − decrease).
 * Absolute previous prices keep the cart alert aligned with the design mock.
 */
const DEMO_PRICE_AT_ADD: Record<string, number> = {
  // Trimble R780: decreased from $19,000.00 → $18,950.00
  '82758-00': 19000,
  // Trimble External Power Kit: increased from $1,000.00 → $1,180.00
  '92600-00': 1000,
};

/**
 * Signed price delta (new − previous) for demo / session drift.
 * Positive = increased, negative = decreased.
 */
export function resolveDemoPriceDelta(
  product: CatalogProduct
): number | undefined {
  const atAdd = DEMO_PRICE_AT_ADD[product.partNumber];
  if (atAdd != null) {
    const current = parsePrice(product.price);
    const delta = Math.round((current - atAdd) * 100) / 100;
    return delta !== 0 ? delta : undefined;
  }

  if (product.listPrice && product.isKit) {
    const bump = Math.round(
      (parsePrice(product.listPrice) - parsePrice(product.price)) * 0.1
    );
    return bump !== 0 ? bump : undefined;
  }

  return undefined;
}

export interface CartPriceChange {
  productId: string;
  partNumber: string;
  name: string;
  previousPrice: number;
  currentPrice: number;
  direction: 'increased' | 'decreased';
}

/** Lines with a non-zero `priceDelta`, shaped for the cart-level alert. */
export function getCartPriceChanges(lines: CartLine[]): CartPriceChange[] {
  const changes: CartPriceChange[] = [];
  for (const line of lines) {
    const delta = line.priceDelta;
    if (delta == null || delta === 0) continue;
    const currentPrice = getLineUnitPrice(line);
    const previousPrice = Math.round((currentPrice - delta) * 100) / 100;
    changes.push({
      productId: line.product.id,
      partNumber: line.product.partNumber,
      name: line.product.name,
      previousPrice,
      currentPrice,
      direction: delta > 0 ? 'increased' : 'decreased',
    });
  }
  return changes;
}
