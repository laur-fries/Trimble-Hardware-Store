import { BILLING_ACCOUNT } from '../checkout/checkoutData';
import type {
  InvoiceDocumentKind,
  InvoiceStatus,
  LogisticsStatus,
  Order,
  OrderHoldReason,
  OrderRowData,
  OrderStatus,
} from '../types/order';
import { resolveOrderShipments } from './shipments';
import type { OrderShipment, PlacedOrder } from './types';

const STATUS_LABELS: Record<OrderStatus, LogisticsStatus> = {
  ORDER_SUBMITTED: 'Order submitted',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Shipped',
  ON_HOLD_SHIPPING: 'On hold',
  ON_HOLD_CREDIT: 'On hold',
  ON_HOLD_EEUC: 'On hold',
  CANCELLED: 'Cancelled',
};

const HOLD_REASONS: Partial<Record<OrderStatus, OrderHoldReason>> = {
  ON_HOLD_CREDIT: 'Credit hold',
  ON_HOLD_EEUC: 'Compliance review',
  ON_HOLD_SHIPPING: 'Shipping review',
};

const UNASSIGNED_TRACKING = 'Pending assignment';

const DAY_MS = 24 * 60 * 60 * 1000;
const NET_TERMS_DAYS = 30;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Net-30 payment due date, counted from the order date. */
function invoiceDueDate(placedIso: string): Date | undefined {
  const due = new Date(placedIso);
  if (Number.isNaN(due.getTime())) return undefined;
  due.setDate(due.getDate() + NET_TERMS_DAYS);
  return startOfDay(due);
}

/** e.g. "Oct 07, 2026" */
function formatDueDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function daysPastDue(due: Date, today = new Date()): number {
  return Math.max(0, Math.round((startOfDay(today).getTime() - due.getTime()) / DAY_MS));
}

function distinct(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/** Shipments that already have a carrier waybill assigned. */
export function trackedShipments(shipments: OrderShipment[]): OrderShipment[] {
  return shipments.filter(
    (s) => s.trackingNumber && s.trackingNumber !== UNASSIGNED_TRACKING
  );
}

/** Public carrier tracking page for a waybill, when the carrier is known. */
export function carrierTrackingUrl(
  carrier: string,
  trackingNumber: string
): string | null {
  const c = carrier.toLowerCase();
  const id = encodeURIComponent(trackingNumber);
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${id}`;
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${id}`;
  return null;
}

export function toOrderRowData(order: Order, placed: PlacedOrder): OrderRowData {
  const shipments = resolveOrderShipments(placed);
  const warehouses = distinct(shipments.map((s) => s.shipTo.label));
  const carriers = distinct(shipments.map((s) => s.carrier));
  const { invoiceStatus } = order;
  const isCancelled = order.status === 'CANCELLED';
  const tracked = trackedShipments(shipments)[0];
  const due =
    invoiceStatus === 'Open' || invoiceStatus === 'Overdue'
      ? invoiceDueDate(order.placedTimestamp)
      : undefined;

  return {
    salesOrderNumber: order.salesOrderNumber,
    dealerPoNumber: order.dealerPoNumber,
    placedDate: order.placedTimestamp,
    placedBy: order.createdByTid,
    totalItemCount: order.lineItems.length,
    shipmentCount: shipments.length,
    warehouseSummary: isCancelled
      ? 'Order cancelled prior to dispatch'
      : warehouses.length > 1
        ? `Multiple warehouses (${warehouses.length})`
        : (warehouses[0] ?? order.shippingAddressName),
    carrierSummary: isCancelled
      ? ''
      : carriers.length > 1
        ? 'Multiple carriers'
        : (carriers[0] ?? order.carrierName),
    logisticsStatus: STATUS_LABELS[order.status],
    holdReason: HOLD_REASONS[order.status],
    invoiceStatus,
    invoiceDueDate: due ? formatDueDate(due) : undefined,
    daysOverdue: due && invoiceStatus === 'Overdue' ? daysPastDue(due) : undefined,
    netTotal: order.totalNetPrice,
    paymentTerms: BILLING_ACCOUNT.paymentTerms,
    hasSpecialRequest: Boolean(order.hasSpecialInstructions),
    specialRequestNote: order.specialInstructionsText?.trim() || undefined,
    trackingNumber: tracked?.trackingNumber ?? order.trackingNumber,
    trackingCarrier: tracked?.carrier ?? order.carrierName,
  };
}

export function logisticsStatusTone(
  row: Pick<OrderRowData, 'logisticsStatus' | 'holdReason'>
): {
  color: 'primary' | 'success' | 'warning' | 'danger' | 'tertiary';
  icon: string;
} {
  switch (row.logisticsStatus) {
    case 'Shipped':
      return { color: 'success', icon: 'check_circle' };
    case 'In transit':
      return { color: 'primary', icon: 'delivery_truck' };
    case 'Order submitted':
    case 'Processing':
      return { color: 'tertiary', icon: 'hourglass' };
    case 'On hold':
      return {
        color: row.holdReason === 'Compliance review' ? 'danger' : 'warning',
        icon: 'alert',
      };
    case 'Cancelled':
      return { color: 'tertiary', icon: 'cancel_circle' };
  }
}

export interface InvoiceStatePresentation {
  label: string;
  /** Hover text explaining the state in accounting terms. */
  description: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'tertiary';
  variant: 'filled' | 'outlined';
  icon: string;
}

type InvoiceRowFields = Pick<OrderRowData, 'invoiceDueDate' | 'daysOverdue'> & {
  invoiceStatus: InvoiceStatus;
};

/** Badge treatment for each PRD invoice status. Every status pairs color with an icon and text. */
export function invoiceStatePresentation(row: InvoiceRowFields): InvoiceStatePresentation {
  switch (row.invoiceStatus) {
    case 'Open':
      return {
        label: row.invoiceDueDate ? `Open · ${row.invoiceDueDate}` : 'Open',
        description: `Official invoice issued. Payment due ${row.invoiceDueDate ?? 'within Net 30 days'}.`,
        color: 'warning',
        variant: 'filled',
        icon: 'calendar',
      };
    case 'Paid':
      return {
        label: 'Paid',
        description: 'Invoice settled in full',
        color: 'success',
        variant: 'filled',
        icon: 'check_circle',
      };
    case 'Overdue': {
      const days = row.daysOverdue ?? 0;
      return {
        label: days > 0 ? `Overdue (${days}d)` : 'Overdue',
        description: `Payment past terms. ${days} ${days === 1 ? 'day' : 'days'} overdue${
          row.invoiceDueDate ? ` (due ${row.invoiceDueDate})` : ''
        }.`,
        color: 'danger',
        variant: 'filled',
        icon: 'alert',
      };
    }
    case 'Cancelled':
      return {
        label: 'Cancelled',
        description: 'Order cancelled. Invoice voided.',
        color: 'tertiary',
        variant: 'outlined',
        icon: 'cancel_circle',
      };
  }
}

/** Orders get a tax invoice once they ship; until then only the proforma exists. */
export function downloadableDocumentKind(
  row: Pick<OrderRowData, 'invoiceStatus'>
): InvoiceDocumentKind | null {
  if (row.invoiceStatus === 'Cancelled') return null;
  return row.invoiceStatus ? 'INVOICE' : 'PROFORMA';
}

export function invoiceDownloadLabel(kind: InvoiceDocumentKind): string {
  return kind === 'PROFORMA' ? 'Download proforma (PDF)' : 'Download invoice (PDF)';
}