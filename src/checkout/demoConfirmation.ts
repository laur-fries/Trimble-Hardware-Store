import { getLineUnitPrice, type BomPricedLine } from '../cart/bomHelpers';
import { buildOrderBreakdown } from '../cart/orderPricing';
import { catalogProducts } from '../catalogData';
import { SHIPPING_ADDRESSES } from './checkoutData';
import {
  formatShipmentAddress,
  type ConfirmationPricing,
  type ConfirmationShipment,
} from './confirmation';
import { formatConfirmationArrivalLine } from './confirmationDeliveryCopy';

const PLACED_AT = '2026-08-02T14:00:00.000Z';
const CARRIER = 'FedEx Ground';

/** Demo multi-warehouse order shown when the page is opened without checkout state. */
const DEMO_ORDER: { addressIndex: number; lines: [pn: string, qty: number][] }[] = [
  {
    addressIndex: 0,
    lines: [
      ['82758-00', 6],
      ['121760-00', 6],
      ['92600-00', 4],
      ['58957-10', 12],
      ['CB460-00', 2],
      ['PM200-00', 8],
      ['MH-KIT-30', 3],
    ],
  },
  {
    addressIndex: 1,
    lines: [
      ['01001-00', 2],
      ['SECO-CBL-05', 10],
      ['TSC5-KIT', 2],
    ],
  },
];

function demoLines(pnQty: [string, number][]): BomPricedLine[] {
  return pnQty.flatMap(([pn, quantity]) => {
    const product = catalogProducts.find(
      (p) => p.partNumber === pn && !p.isDiscontinued
    );
    return product ? [{ product, quantity }] : [];
  });
}

export function buildDemoConfirmation(): {
  shipments: ConfirmationShipment[];
  pricing: ConfirmationPricing;
  netTotal: number;
} {
  const groups = DEMO_ORDER.map((group) => ({
    address: SHIPPING_ADDRESSES[group.addressIndex],
    lines: demoLines(group.lines),
  }));

  const shipments = groups.map(({ address, lines }, index) => ({
    addressId: address.id,
    addressLabel: address.nickname,
    address: formatShipmentAddress(address),
    carrierLabel: CARRIER,
    estimatedDelivery: formatConfirmationArrivalLine({
      hasSpecialInstructions: false,
      placedAt: PLACED_AT,
      daysFromPlaced: index === 0 ? 10 : 14,
      carrierLabel: CARRIER,
    }),
    items: lines.map((line) => ({
      productId: line.product.id,
      partNumber: line.product.partNumber,
      title: line.product.name,
      quantity: line.quantity,
      unitPrice: getLineUnitPrice(line),
      image: line.product.image,
      isKit: Boolean(line.product.isKit),
      estimatedDelivery: '',
    })),
  }));

  const breakdown = buildOrderBreakdown(groups.flatMap((g) => g.lines));
  return {
    shipments,
    pricing: {
      subtotalMsrp: breakdown.msrpSubtotal,
      dealerDiscount: breakdown.standardDiscount,
      kpiDiscount: breakdown.kpiDiscount,
      promoSavings: breakdown.promoSavings,
      estimatedTax: breakdown.estimatedTax,
    },
    netTotal: breakdown.netTotal,
  };
}
