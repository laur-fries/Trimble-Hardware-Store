import type { OrderStatus } from '../types/order';

export function orderStatusBadge(status: OrderStatus): {
  color: 'primary' | 'success' | 'warning' | 'danger' | 'tertiary';
  label: string;
} {
  switch (status) {
    case 'ORDER_SUBMITTED':
      return { color: 'tertiary', label: 'Order submitted' };
    case 'PROCESSING':
      return { color: 'tertiary', label: 'Processing' };
    case 'SHIPPED':
    case 'DELIVERED':
      return { color: 'success', label: 'Shipped' };
    case 'IN_TRANSIT':
      return { color: 'primary', label: 'In transit' };
    case 'ON_HOLD_CREDIT':
    case 'ON_HOLD_SHIPPING':
      return { color: 'warning', label: 'On hold' };
    case 'ON_HOLD_EEUC':
      return { color: 'danger', label: 'On hold' };
    case 'CANCELLED':
      return { color: 'tertiary', label: 'Cancelled' };
  }
}

export function isShippingReviewHold(order: {
  status: OrderStatus;
  hasSpecialInstructions?: boolean;
}): boolean {
  return (
    order.status === 'ON_HOLD_SHIPPING' &&
    Boolean(order.hasSpecialInstructions)
  );
}

export function isUnshippedStatus(status: OrderStatus): boolean {
  return (
    status === 'ORDER_SUBMITTED' ||
    status === 'PROCESSING' ||
    status.startsWith('ON_HOLD')
  );
}

export function isFulfilledForPackout(status: OrderStatus): boolean {
  return (
    status === 'SHIPPED' ||
    status === 'IN_TRANSIT' ||
    status === 'DELIVERED'
  );
}
