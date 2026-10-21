import { parsePrice } from '../catalogData';
import { getLineTotal, getLineUnitPrice, type BomPricedLine } from './bomHelpers';

/** Standard contractual discount off MSRP subtotal. */
export const STANDARD_DEALER_DISCOUNT_RATE = 0.1;
/** Additional KPI discount off MSRP subtotal. */
export const KPI_DISCOUNT_RATE = 0.02;
/** Estimated tax applied to the net after all discounts (prototype). */
export const TAX_RATE = 0.0825;

function toCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** MSRP line total (list × qty), scaled when a kit is partially unbundled. */
export function getLineMsrpTotal(line: BomPricedLine): number {
  const list = line.product.listPrice
    ? parsePrice(line.product.listPrice)
    : null;
  if (list == null || list <= 0) {
    return getLineTotal(line);
  }

  const catalogDealerUnit = parsePrice(line.product.price);
  const currentUnit = getLineUnitPrice(line);
  if (catalogDealerUnit <= 0) {
    return list * Math.max(1, line.quantity);
  }

  const scale = currentUnit / catalogDealerUnit;
  return list * scale * Math.max(1, line.quantity);
}

export interface OrderBreakdown {
  msrpSubtotal: number;
  dealerSubtotal: number;
  standardDiscount: number;
  kpiDiscount: number;
  promoSavings: number;
  estimatedTax: number;
  netTotal: number;
}

/**
 * B2B order math over the full cart (all lines):
 * Subtotal (MSRP) − Dealer discount (10%) − KPI discount (2%) (+ promo)
 * + Estimated tax (8.25% of the discounted net) = Total
 */
export function buildOrderBreakdown(
  lines: BomPricedLine[],
  promoSavings = 0
): OrderBreakdown {
  const msrpSubtotal = toCents(
    lines.reduce((total, line) => total + getLineMsrpTotal(line), 0)
  );
  const dealerSubtotal = toCents(
    lines.reduce((total, line) => total + getLineTotal(line), 0)
  );
  const standardDiscount = toCents(msrpSubtotal * STANDARD_DEALER_DISCOUNT_RATE);
  const kpiDiscount = toCents(msrpSubtotal * KPI_DISCOUNT_RATE);
  const clampedPromo = toCents(
    Math.min(
      Math.max(0, promoSavings),
      Math.max(0, msrpSubtotal - standardDiscount - kpiDiscount)
    )
  );
  const taxableNet = Math.max(
    0,
    msrpSubtotal - standardDiscount - kpiDiscount - clampedPromo
  );
  const estimatedTax = toCents(taxableNet * TAX_RATE);
  // Sum of the rounded display values, so the summary rows always reconcile.
  const netTotal = Math.max(
    0,
    toCents(
      msrpSubtotal - standardDiscount - kpiDiscount - clampedPromo + estimatedTax
    )
  );

  return {
    msrpSubtotal,
    dealerSubtotal,
    standardDiscount,
    kpiDiscount,
    promoSavings: clampedPromo,
    estimatedTax,
    netTotal,
  };
}
