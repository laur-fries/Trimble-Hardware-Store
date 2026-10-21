import type { CartLine } from '../cart/CartContext';
import { getLineUnitPrice } from '../cart/bomHelpers';
import type { ShippingAddress } from './checkoutData';
import { formatConfirmationArrivalLine } from './confirmationDeliveryCopy';
import { groupShipmentsByAddress } from './shipments';

export type BuildConfirmationShipmentsOptions = {
  hasSpecialInstructions: boolean;
  placedAt?: string;
  carrierLabel?: string;
};

export interface ConfirmationLineItem {
  productId: string;
  partNumber: string;
  title: string;
  quantity: number;
  unitPrice: number;
  image: string;
  isKit?: boolean;
  /** Prototype per-line ETA copy. */
  estimatedDelivery: string;
}

export interface ConfirmationShipment {
  addressId: string;
  addressLabel: string;
  /** One-line street address for the manifest header. */
  address?: string;
  carrierLabel?: string;
  estimatedDelivery: string;
  items: ConfirmationLineItem[];
}

/** Order-level money breakdown shown in the confirmation sidebar. */
export interface ConfirmationPricing {
  subtotalMsrp: number;
  dealerDiscount: number;
  kpiDiscount: number;
  promoSavings: number;
  estimatedTax: number;
}

export function formatShipmentAddress(address: ShippingAddress): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`;
}

/** Build display shipments for the order confirmation page. */
export function buildConfirmationShipments(
  isMultiShip: boolean,
  lines: CartLine[],
  addressMap: Record<string, ShippingAddress>,
  defaultAddress: ShippingAddress,
  options: BuildConfirmationShipmentsOptions = { hasSpecialInstructions: false }
): ConfirmationShipment[] {
  const groups = isMultiShip
    ? groupShipmentsByAddress(lines, addressMap, defaultAddress)
    : [
        {
          address: defaultAddress,
          items: lines.map((line) => ({
            productId: line.product.id,
            partNumber: line.product.partNumber,
            title: line.product.name,
            quantity: line.quantity,
          })),
        },
      ];

  return groups.map((group, index) => ({
    addressId: group.address.id,
    addressLabel: group.address.nickname,
    address: formatShipmentAddress(group.address),
    carrierLabel: options.carrierLabel,
    estimatedDelivery: formatConfirmationArrivalLine({
      hasSpecialInstructions: options.hasSpecialInstructions,
      placedAt: options.placedAt,
      daysFromPlaced: index === 0 ? 10 : 14,
      carrierLabel: options.carrierLabel,
    }),
    items: group.items.map((item, itemIndex) => {
      const line = lines.find((l) => l.product.id === item.productId);
      return {
        productId: item.productId,
        partNumber: item.partNumber,
        title: item.title,
        quantity: item.quantity,
        unitPrice: line ? getLineUnitPrice(line) : 0,
        image: line?.product.image ?? '/products/gnss-receiver.png',
        isKit: Boolean(line?.product.isKit),
        estimatedDelivery: formatConfirmationArrivalLine({
          hasSpecialInstructions: options.hasSpecialInstructions,
          placedAt: options.placedAt,
          daysFromPlaced: itemIndex === 0 ? 12 : 10,
          carrierLabel: options.carrierLabel,
        }),
      };
    }),
  }));
}
