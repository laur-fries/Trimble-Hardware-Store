import type { CartLine } from '../cart/CartContext';
import type { Address, ShippingAddress } from './checkoutData';
import type { FulfillmentPreference } from './fulfillmentPreferences';

export type { Address, ShippingAddress };

export interface ShipmentLineItem {
  partNumber: string;
  quantity: number;
}

export interface ShipmentGroup {
  address: Address;
  items: ShipmentLineItem[];
}

/** Structured checkout shipping payload (single or multi-destination). */
export interface ShippingPayload {
  isMultiShip: boolean;
  shipments: ShipmentGroup[];
  carrierId?: string;
  fulfillmentPreference?: FulfillmentPreference;
  requestedShipDate?: string;
}

/** Richer grouping used for the live multi-ship preview UI. */
export interface ShipmentPreviewGroup {
  address: Address;
  items: Array<{
    productId: string;
    partNumber: string;
    title: string;
    quantity: number;
  }>;
}

export function buildDefaultAddressMap(
  lines: CartLine[],
  address: Address
): Record<string, Address> {
  const next: Record<string, Address> = {};
  for (const line of lines) {
    next[line.product.id] = address;
  }
  return next;
}

/** Group cart lines by selected ship-to for the multi-location preview. */
export function groupShipmentsByAddress(
  lines: CartLine[],
  addressMap: Record<string, Address>,
  fallback: Address
): ShipmentPreviewGroup[] {
  const groups = new Map<string, ShipmentPreviewGroup>();

  for (const line of lines) {
    const address = addressMap[line.product.id] ?? fallback;
    const existing = groups.get(address.id);
    const item = {
      productId: line.product.id,
      partNumber: line.product.partNumber,
      title: line.product.name,
      quantity: line.quantity,
    };
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(address.id, { address, items: [item] });
    }
  }

  return Array.from(groups.values());
}

/** Export the checkout shipping JSON contract for place-order / ERP handoff. */
export function buildShippingPayload(
  isMultiShip: boolean,
  lines: CartLine[],
  addressMap: Record<string, Address>,
  defaultAddress: Address,
  options?: {
    carrierId?: string;
    fulfillmentPreference?: FulfillmentPreference;
    requestedShipDate?: string;
  }
): ShippingPayload {
  const base = !isMultiShip
    ? {
        isMultiShip: false,
        shipments: [
          {
            address: defaultAddress,
            items: lines.map((line) => ({
              partNumber: line.product.partNumber,
              quantity: line.quantity,
            })),
          },
        ],
      }
    : {
        isMultiShip: true,
        shipments: groupShipmentsByAddress(lines, addressMap, defaultAddress).map(
          (group) => ({
            address: group.address,
            items: group.items.map((item) => ({
              partNumber: item.partNumber,
              quantity: item.quantity,
            })),
          })
        ),
      };

  return {
    ...base,
    carrierId: options?.carrierId,
    fulfillmentPreference: options?.fulfillmentPreference,
    requestedShipDate: options?.requestedShipDate || undefined,
  };
}

/** Compact select label: "California Warehouse - San Francisco, CA". */
export function formatShipToOptionLabel(address: Address): string {
  return `${address.nickname} - ${address.city}, ${address.state}`;
}

/** Full radio label: "California Warehouse - 1234 Construction Ave. San Francisco, CA 97201". */
export function formatShipToRadioLabel(address: Address): string {
  return `${address.nickname} - ${address.street} ${address.city}, ${address.state} ${address.postalCode}`;
}
