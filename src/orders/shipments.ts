import type {
  OrderShipment,
  PlacedOrder,
  ShipmentFulfillmentStatus,
} from './types';

export function shipmentStatusBadge(status: ShipmentFulfillmentStatus): {
  color: 'primary' | 'success' | 'warning' | 'tertiary';
  label: string;
} {
  switch (status) {
    case 'Processing':
      return { color: 'primary', label: 'Processing' };
    case 'In Transit':
      return { color: 'tertiary', label: 'In Transit' };
    case 'Delivered':
      return { color: 'success', label: 'Delivered' };
    case 'On Hold':
      return { color: 'warning', label: 'On Hold' };
  }
}

/** Resolve explicit shipment groups, or synthesize one from order-level fields. */
export function resolveOrderShipments(order: PlacedOrder): OrderShipment[] {
  if (order.shipments && order.shipments.length > 0) {
    return order.shipments;
  }

  const status: ShipmentFulfillmentStatus =
    order.status === 'Delivered'
      ? 'Delivered'
      : order.status === 'On Hold'
        ? 'On Hold'
        : order.status === 'Shipped'
          ? 'In Transit'
          : 'Processing';

  return [
    {
      id: `${order.id}-ship-1`,
      methodLabel: order.carrier,
      status,
      statusDetail:
        status === 'Delivered'
          ? `Delivered ${new Date(order.placedDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}`
          : status === 'In Transit'
            ? 'In transit'
            : order.status,
      carrier: order.carrier,
      trackingNumber: 'Pending assignment',
      shipTo: order.shippingAddress,
      items: order.items,
    },
  ];
}

export function shipmentCountLabel(order: PlacedOrder): string | null {
  const count = resolveOrderShipments(order).length;
  if (count <= 1) return null;
  return `${count} shipments`;
}

export function formatShipmentHeader(
  shipment: OrderShipment,
  index: number,
  total: number
): string {
  return `SHIPMENT ${index + 1} of ${total}: ${shipment.methodLabel} (${shipment.statusDetail})`;
}
