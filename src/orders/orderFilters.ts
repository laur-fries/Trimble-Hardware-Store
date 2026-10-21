import type { Order, OrderStatus } from '../types/order';
import type { PendingDiscountRequest } from './types';

export type OrderStatusFilter =
  | 'all'
  | 'submitted'
  | 'processing'
  | 'shipped'
  | 'on_hold'
  | 'in_transit';

export type OrderTimeframeFilter = '30d' | '6m' | '1y' | '2026' | '5y';

export type OrderCarrierFilter = 'all' | 'fedex' | 'ups' | 'freight';

export interface OrderListFilters {
  query: string;
  status: OrderStatusFilter;
  timeframe: OrderTimeframeFilter;
  carrier: OrderCarrierFilter;
}

export const DEFAULT_ORDER_FILTERS: OrderListFilters = {
  query: '',
  status: 'all',
  timeframe: '5y',
  carrier: 'all',
};

const ON_HOLD_STATUSES: OrderStatus[] = [
  'ON_HOLD_CREDIT',
  'ON_HOLD_EEUC',
  'ON_HOLD_SHIPPING',
];

function matchesStatusFilter(status: OrderStatus, filter: OrderStatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'submitted') return status === 'ORDER_SUBMITTED';
  if (filter === 'processing') return status === 'PROCESSING';
  if (filter === 'shipped') return status === 'SHIPPED' || status === 'DELIVERED';
  if (filter === 'in_transit') return status === 'IN_TRANSIT';
  if (filter === 'on_hold') return ON_HOLD_STATUSES.includes(status);
  return true;
}

function matchesTimeframe(iso: string, filter: OrderTimeframeFilter): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return true;
  const now = Date.now();
  const ms = date.getTime();
  switch (filter) {
    case '30d':
      return ms >= now - 30 * 24 * 60 * 60 * 1000;
    case '6m':
      return ms >= now - 183 * 24 * 60 * 60 * 1000;
    case '1y':
      return ms >= now - 365 * 24 * 60 * 60 * 1000;
    case '2026':
      return date.getFullYear() === 2026;
    case '5y':
    default:
      return ms >= now - 5 * 365 * 24 * 60 * 60 * 1000;
  }
}

function matchesCarrier(carrierName: string, filter: OrderCarrierFilter): boolean {
  if (filter === 'all') return true;
  const c = carrierName.toLowerCase();
  if (filter === 'fedex') return c.includes('fedex');
  if (filter === 'ups') return c.includes('ups');
  if (filter === 'freight') {
    return c.includes('freight') || c.includes('ltl') || c.includes('logistics');
  }
  return true;
}

function matchesQuery(order: Order, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (order.salesOrderNumber.toLowerCase().includes(q)) return true;
  if (order.dealerPoNumber.toLowerCase().includes(q)) return true;
  return order.lineItems.some(
    (line) =>
      line.pn.toLowerCase().includes(q) ||
      line.title.toLowerCase().includes(q)
  );
}

export function filterOrders(orders: Order[], filters: OrderListFilters): Order[] {
  return orders.filter(
    (order) =>
      matchesQuery(order, filters.query) &&
      matchesStatusFilter(order.status, filters.status) &&
      matchesTimeframe(order.placedTimestamp, filters.timeframe) &&
      matchesCarrier(order.carrierName, filters.carrier)
  );
}

export function filterPendingByQuery(
  requests: PendingDiscountRequest[],
  query: string
): PendingDiscountRequest[] {
  const q = query.trim().toLowerCase();
  if (!q) return requests;
  return requests.filter(
    (request) =>
      request.requestId.toLowerCase().includes(q) ||
      request.items.some(
        (item) =>
          item.partNumber.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q)
      )
  );
}
