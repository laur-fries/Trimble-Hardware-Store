import type { StockStatus } from '../catalogData';

/** Availability for a kit sub-component on checkout / order surfaces. */
export type KitComponentStockStatus = 'IN_STOCK' | 'BACKORDER' | 'OUT_OF_STOCK';

export interface KitComponent {
  id: string;
  pn: string;
  title: string;
  qtyPerKit: number;
  imageUrl?: string;
  inStockStatus: KitComponentStockStatus;
}

/** Checkout / order summary line with optional kit BOM. */
export interface OrderLineItem {
  id: string;
  pn: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  isKit?: boolean;
  kitComponents?: KitComponent[];
  /** Kit-level availability rolled up from the worst sub-component. */
  kitStockRollup?: StockStatus;
}

export const kitComponentStockMeta: Record<
  KitComponentStockStatus,
  {
    color: 'success' | 'warning' | 'danger';
    icon: string;
    label: string;
  }
> = {
  IN_STOCK: {
    color: 'success',
    icon: 'check_circle',
    label: 'Plenty in stock',
  },
  BACKORDER: {
    color: 'warning',
    icon: 'warning',
    label: 'Backorder available',
  },
  OUT_OF_STOCK: {
    color: 'danger',
    icon: 'cancel_circle',
    label: 'Out of stock',
  },
};

/** Trimble sales order lifecycle (account orders). */
export type OrderStatus =
  | 'ORDER_SUBMITTED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'ON_HOLD_CREDIT'
  | 'ON_HOLD_EEUC'
  | 'ON_HOLD_SHIPPING'
  | 'CANCELLED';

/**
 * PRD invoice lifecycle. An order without a status has not been invoiced yet
 * (unshipped); its only financial document is the pre-shipment proforma.
 */
export type InvoiceStatus = 'Open' | 'Paid' | 'Overdue' | 'Cancelled';

/** Downloadable financial document. Proforma is a document, never a status. */
export type InvoiceDocumentKind = 'INVOICE' | 'PROFORMA';

export interface OrderLineItemRow {
  pn: string;
  title: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  isKit?: boolean;
  isDiscontinued?: boolean;
  replacementPn?: string;
  kitComponents?: KitComponent[];
}

/** Account activity log entry (up to 4-year retention). */
export interface AuditLogEntry {
  timestamp: string;
  ipAddress: string;
  location: string;
  tid: string;
  action: string;
}

/** @deprecated Use AuditLogEntry — kept for drawer migration */
export interface OrderAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  ipAddress: string;
  message: string;
  location?: string;
}

/**
 * PRD customer-facing order status, independent of invoice state. Delivered
 * orders report as "Shipped"; every hold type reports as "On hold".
 * "Cancelled" is terminal and is not offered as a status filter.
 */
export type LogisticsStatus =
  | 'Order submitted'
  | 'Processing'
  | 'Shipped'
  | 'In transit'
  | 'On hold'
  | 'Cancelled';

/** Why an order is on hold; shown alongside the "On hold" status. */
export type OrderHoldReason = 'Credit hold' | 'Compliance review' | 'Shipping review';

/**
 * One fixed-height row in the placed orders table. A 1-item order and a
 * 120-item multi-warehouse order summarize to the same shape.
 */
export interface OrderRowData {
  salesOrderNumber: string;
  dealerPoNumber: string;
  placedDate: string;
  placedBy: string;
  totalItemCount: number;
  shipmentCount: number;
  /** e.g. "California Warehouse" or "Multiple warehouses (2)" */
  warehouseSummary: string;
  /** e.g. "FedEx Freight" or "Multiple carriers" */
  carrierSummary: string;
  logisticsStatus: LogisticsStatus;
  /** Set only when logisticsStatus is "On hold". */
  holdReason?: OrderHoldReason;
  /** Undefined until the order ships and is invoiced. */
  invoiceStatus?: InvoiceStatus;
  /** Payment due date, e.g. "Aug 27, 2026" (Open and Overdue only). */
  invoiceDueDate?: string;
  /** Whole days past the due date (Overdue only). */
  daysOverdue?: number;
  netTotal: number;
  paymentTerms: string;
  hasSpecialRequest?: boolean;
  specialRequestNote?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
}

/** Account order record (placed orders tab). */
export interface Order {
  salesOrderNumber: string;
  dealerPoNumber: string;
  createdByTid: string;
  placedTimestamp: string;
  totalNetPrice: number;
  status: OrderStatus;
  /** Undefined until the order ships and is invoiced. */
  invoiceStatus?: InvoiceStatus;
  shippingAddressName: string;
  carrierName: string;
  trackingNumber?: string;
  actualDeliveryDate?: string;
  isProformaAvailable: boolean;
  digitalPackoutUrl?: string;
  eeucRequired?: boolean;
  /** Manual shipping review hold (special instructions). */
  hasSpecialInstructions?: boolean;
  specialInstructionsText?: string;
  lineItems: OrderLineItemRow[];
  auditTrail?: AuditLogEntry[];
  /** Legacy normalized entries for components still mapping from placed orders */
  orderAuditEntries?: OrderAuditEntry[];
  sourcePlacedOrderId: string;
}
