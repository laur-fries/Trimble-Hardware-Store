import { findCatalogProduct } from '../catalog/productLookup';
import { resolveReplacementProduct } from '../catalog/discontinuation';
import type {
  AuditLogEntry,
  Order,
  OrderAuditEntry,
  OrderLineItemRow,
  OrderStatus,
  InvoiceStatus,
} from '../types/order';
import type { PlacedOrder } from './types';
import { resolveOrderShipments } from './shipments';

function mapLegacyStatus(order: PlacedOrder): OrderStatus {
  if (order.status === 'On Hold') {
    if (order.holdType === 'EEUC') return 'ON_HOLD_EEUC';
    if (order.holdType === 'SHIPPING') return 'ON_HOLD_SHIPPING';
    return 'ON_HOLD_CREDIT';
  }
  if (order.status === 'Cancelled') return 'CANCELLED';
  if (order.status === 'Delivered') return 'DELIVERED';
  if (order.status === 'Shipped') {
    const shipments = resolveOrderShipments(order);
    const inTransit = shipments.some((s) => s.status === 'In Transit');
    return inTransit ? 'IN_TRANSIT' : 'SHIPPED';
  }
  if (order.status === 'Processing') return 'PROCESSING';
  return 'ORDER_SUBMITTED';
}

/** Unshipped orders are not invoiced yet and have no invoice status. */
function mapInvoiceStatus(
  order: PlacedOrder,
  status: OrderStatus
): InvoiceStatus | undefined {
  if (order.invoiceStatus) return order.invoiceStatus;
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'DELIVERED' || status === 'SHIPPED' || status === 'IN_TRANSIT') {
    return 'Open';
  }
  return undefined;
}

function buildAuditTrail(order: PlacedOrder): {
  auditTrail: AuditLogEntry[];
  orderAuditEntries: OrderAuditEntry[];
} {
  const user = order.createdByTid ?? 'dealer.ops@trimblehardware.demo';
  const location = order.shippingAddress?.lines?.slice(-1)[0] ?? 'United States';
  const auditTrail: AuditLogEntry[] = [
    {
      timestamp: order.placedDate,
      tid: user,
      ipAddress: order.submitterIp ?? '192.168.12.44',
      location,
      action: `Order submitted by ${user}`,
    },
  ];
  const orderAuditEntries: OrderAuditEntry[] = [
    {
      id: `${order.id}-submit`,
      timestamp: order.placedDate,
      user,
      ipAddress: order.submitterIp ?? '192.168.12.44',
      location,
      message: `Order submitted by ${user}`,
    },
  ];
  if (order.status === 'Shipped' || order.status === 'Delivered') {
    const shipTs = order.shippedAt ?? order.placedDate;
    auditTrail.push({
      timestamp: shipTs,
      tid: 'system@trimble.com',
      ipAddress: '10.0.0.1',
      location: 'Trimble Logistics',
      action: 'Shipment released to carrier',
    });
    orderAuditEntries.push({
      id: `${order.id}-ship`,
      timestamp: shipTs,
      user: 'system@trimble.com',
      ipAddress: '10.0.0.1',
      message: 'Shipment released to carrier',
    });
  }
  if (order.status === 'On Hold') {
    const isShippingHold = order.holdType === 'SHIPPING';
    auditTrail.push({
      timestamp: order.placedDate,
      tid: isShippingHold
        ? 'orders.logistics@trimble.com'
        : 'credit.ops@trimble.com',
      ipAddress: '10.0.0.2',
      location,
      action: isShippingHold
        ? 'Order held for manual shipping instruction review'
        : 'Order placed on hold pending review',
    });
    orderAuditEntries.push({
      id: `${order.id}-hold`,
      timestamp: order.placedDate,
      user: isShippingHold
        ? 'orders.logistics@trimble.com'
        : 'credit.ops@trimble.com',
      ipAddress: '10.0.0.2',
      message: isShippingHold
        ? 'Order held for manual shipping instruction review'
        : 'Order placed on hold pending review',
    });
  }
  return { auditTrail, orderAuditEntries };
}

function mapLineItems(order: PlacedOrder): OrderLineItemRow[] {
  return order.items.map((item) => {
    const product = findCatalogProduct(item.partNumber);
    const replacement = product ? resolveReplacementProduct(product) : undefined;
    const qty = item.quantity;
    const unitPrice = item.unitPrice;
    return {
      pn: item.partNumber,
      title: item.title,
      qty,
      unitPrice,
      totalPrice: Math.round(qty * unitPrice * 100) / 100,
      imageUrl: item.image,
      isKit: Boolean(item.kitBom?.length),
      isDiscontinued: Boolean(product?.isDiscontinued),
      replacementPn: replacement?.partNumber,
      kitComponents: item.kitBom?.map((bom, index) => ({
        id: `${item.partNumber}-bom-${index}`,
        pn: bom.partNumber,
        title: bom.title,
        qtyPerKit: bom.quantity,
        imageUrl: bom.image,
        inStockStatus: 'IN_STOCK' as const,
      })),
    };
  });
}

export function mapPlacedOrderToOrder(order: PlacedOrder): Order {
  const status = mapLegacyStatus(order);
  const shipments = resolveOrderShipments(order);
  const primaryShipment = shipments[0];
  const trackingNumber =
    order.trackingNumber ??
    (primaryShipment?.trackingNumber !== 'Pending assignment'
      ? primaryShipment?.trackingNumber
      : undefined);

  const { auditTrail, orderAuditEntries } = buildAuditTrail(order);

  return {
    salesOrderNumber: order.id,
    dealerPoNumber: order.dealerPo,
    createdByTid: order.createdByTid ?? 'dealer.ops@trimblehardware.demo',
    placedTimestamp: order.placedDate,
    totalNetPrice: order.total,
    status,
    invoiceStatus: mapInvoiceStatus(order, status),
    shippingAddressName: order.shipTo,
    carrierName: order.carrier,
    trackingNumber,
    actualDeliveryDate: order.actualDeliveryDate,
    isProformaAvailable:
      status === 'PROCESSING' ||
      status === 'ORDER_SUBMITTED' ||
      status.startsWith('ON_HOLD'),
    digitalPackoutUrl:
      order.digitalPackoutUrl ??
      (status === 'SHIPPED' ||
      status === 'IN_TRANSIT' ||
      status === 'DELIVERED'
        ? `#packout-${order.id}`
        : undefined),
    eeucRequired: order.eeucRequired ?? status === 'ON_HOLD_EEUC',
    hasSpecialInstructions: order.hasSpecialInstructions,
    specialInstructionsText: order.specialInstructionsText,
    lineItems: mapLineItems(order),
    auditTrail,
    orderAuditEntries,
    sourcePlacedOrderId: order.id,
  };
}

export function mapPlacedOrdersToOrders(orders: PlacedOrder[]): Order[] {
  return orders.map(mapPlacedOrderToOrder);
}
