import type { InvoiceStatus } from '../types/order';

export interface OrderAddress {
  label: string;
  lines: string[];
}

export interface KitBomLine {
  partNumber: string;
  title: string;
  quantity: number;
  unitPrice?: number;
  image?: string;
}

export interface LineItem {
  partNumber: string;
  title: string;
  quantity: number;
  unitPrice: number;
  /** Product thumbnail; resolved from catalog when omitted. */
  image?: string;
  /** Nested kit components for BOM accordion in the detail drawer. */
  kitBom?: KitBomLine[];
  /** Optional fulfillment note (e.g. backordered separately). */
  note?: string;
}

export type ShipmentFulfillmentStatus =
  | 'Processing'
  | 'In Transit'
  | 'Delivered'
  | 'On Hold';

/** One physical shipment / destination group within a placed order. */
export interface OrderShipment {
  id: string;
  /** Service / method label shown in the shipment header. */
  methodLabel: string;
  status: ShipmentFulfillmentStatus;
  /** Human status suffix, e.g. "Delivered Aug 2, 2026" or "Est. Aug 12, 2026". */
  statusDetail: string;
  carrier: string;
  trackingNumber: string;
  shipTo: OrderAddress;
  items: LineItem[];
}

export type PlacedOrderHoldType = 'CREDIT' | 'EEUC' | 'SHIPPING';

export interface PlacedOrder {
  id: string; // e.g., "TRM-2026-102938"
  placedDate: string;
  total: number;
  shipTo: string;
  carrier: string;
  dealerPo: string;
  items: LineItem[];
  status: 'Submitted' | 'Processing' | 'Shipped' | 'On Hold' | 'Delivered' | 'Cancelled';
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  holdType?: PlacedOrderHoldType;
  invoiceStatus?: InvoiceStatus;
  createdByTid?: string;
  submitterIp?: string;
  trackingNumber?: string;
  shippedAt?: string;
  actualDeliveryDate?: string;
  digitalPackoutUrl?: string;
  eeucRequired?: boolean;
  hasSpecialInstructions?: boolean;
  specialInstructionsText?: string;
  /**
   * Physical shipment groups. When omitted, the order is treated as a single
   * shipment to `shippingAddress` using order-level carrier metadata.
   */
  shipments?: OrderShipment[];
}

export interface PendingDiscountRequest {
  requestId: string; // e.g., "DA-2026-9941"
  requestedDate: string;
  originalTotal: number;
  requestedTotal: number;
  savingsAmount: number;
  shipTo: string;
  items: LineItem[];
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  expiresInDays?: number; // Valid for 30 days once approved
  rejectionReason?: string;
  /** Prototype: underlying DA id for checkout / simulate actions. */
  sourceDaId: string;
  /** Prototype: preserve counter-offer messaging when mapped from DA. */
  counterOfferLabel?: string;
}
