import { DELIVERY_PENDING_SHIPPING_REVIEW } from '../checkout/confirmationDeliveryCopy';
import type { Order } from '../types/order';
import { isShippingReviewHold } from './orderStatusDisplay';
import type { OrderShipment, PlacedOrder } from './types';
import { resolveOrderShipments } from './shipments';

export { DELIVERY_PENDING_SHIPPING_REVIEW };

function formatDeliveryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

const DATE_IN_STATUS_DETAIL =
  /(?:Est\.|Estimated|Delivered|Guaranteed)\s*[:\u2013-]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})/i;

function parseDateFromStatusDetail(detail: string): string | null {
  const match = detail.match(DATE_IN_STATUS_DETAIL);
  if (!match?.[1]) return null;
  const parsed = new Date(match[1]);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function shipmentArrivalIso(shipment: OrderShipment): string | null {
  if (shipment.status === 'Delivered') {
    return parseDateFromStatusDetail(shipment.statusDetail);
  }
  if (shipment.status === 'In Transit' || shipment.status === 'Processing') {
    return parseDateFromStatusDetail(shipment.statusDetail);
  }
  return null;
}

export type OrderDeliveryLine = {
  prefix: 'Guaranteed arrival' | 'Estimated arrival' | 'Delivered';
  dateLabel: string;
  carrier: string;
};

function lineToLabel(line: OrderDeliveryLine): string {
  if (line.prefix === 'Delivered') {
    return `Delivered ${line.dateLabel} (${line.carrier})`;
  }
  return `${line.prefix}: ${line.dateLabel} (${line.carrier})`;
}

/** Dealer-facing delivery lines — dates first; never raw tracking numbers. */
export function orderDeliveryLines(
  order: Order,
  placedOrder?: PlacedOrder
): OrderDeliveryLine[] {
  if (isShippingReviewHold(order)) {
    return [];
  }

  const shipments = placedOrder ? resolveOrderShipments(placedOrder) : [];

  if (shipments.length > 0) {
    const lines: OrderDeliveryLine[] = [];
    for (const shipment of shipments) {
      const iso = shipmentArrivalIso(shipment);
      if (!iso) continue;
      const dateLabel = formatDeliveryDate(iso);
      if (shipment.status === 'Delivered') {
        lines.push({
          prefix: 'Delivered',
          dateLabel,
          carrier: shipment.carrier,
        });
      } else if (shipment.status === 'In Transit') {
        lines.push({
          prefix: 'Guaranteed arrival',
          dateLabel,
          carrier: shipment.carrier,
        });
      } else if (shipment.status === 'Processing') {
        lines.push({
          prefix: 'Estimated arrival',
          dateLabel,
          carrier: shipment.carrier,
        });
      }
    }
    if (lines.length > 0) return lines;
  }

  if (order.actualDeliveryDate) {
    const prefix =
      order.status === 'DELIVERED'
        ? ('Delivered' as const)
        : ('Guaranteed arrival' as const);
    return [
      {
        prefix,
        dateLabel: formatDeliveryDate(order.actualDeliveryDate),
        carrier: order.carrierName,
      },
    ];
  }

  if (
    order.status === 'PROCESSING' ||
    order.status === 'ORDER_SUBMITTED' ||
    order.status.startsWith('ON_HOLD')
  ) {
    return [
      {
        prefix: 'Estimated arrival',
        dateLabel: 'Pending — confirmed when order ships',
        carrier: order.carrierName,
      },
    ];
  }

  if (
    order.status === 'IN_TRANSIT' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED'
  ) {
    return [
      {
        prefix: 'Guaranteed arrival',
        dateLabel: 'Date pending from carrier',
        carrier: order.carrierName,
      },
    ];
  }

  return [];
}

/** Primary single-line label (first shipment / order-level date). */
export function orderGuaranteedArrivalLabel(
  order: Order,
  placedOrder?: PlacedOrder
): string | null {
  const lines = orderDeliveryLines(order, placedOrder);
  if (lines.length === 0) return null;
  return lineToLabel(lines[0]);
}

export function formatOrderDeliveryLine(line: OrderDeliveryLine): string {
  return lineToLabel(line);
}

export function isProcessingStale(iso: string): boolean {
  const placed = new Date(iso).getTime();
  if (Number.isNaN(placed)) return false;
  return Date.now() - placed > 48 * 60 * 60 * 1000;
}
