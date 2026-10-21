import {
  ModusWcBadge,
  ModusWcCard,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { cartLinesToOrderLineItems } from '../../checkout/orderLineItems';
import type { CartLine } from '../../cart/CartContext';
import OrderItemRow from './OrderItemRow';

interface OrderItemsCardProps {
  lines: CartLine[];
  frozen?: boolean;
  approvedDaId?: string;
}

export default function OrderItemsCard({
  lines,
  frozen = false,
  approvedDaId,
}: OrderItemsCardProps) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const items = cartLinesToOrderLineItems(lines);

  return (
    <ModusWcCard bordered={true} padding="compact">
      <div slot="title">
        <div className="flex flex-wrap items-center gap-2">
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label={`Order Items (${count})`}
          />
          {frozen ? (
            <ModusWcBadge variant="filled" color="success" size="sm">
              Approved Discretionary Discount Applied
            </ModusWcBadge>
          ) : null}
        </div>
      </div>

      {frozen && approvedDaId ? (
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="px-1 pt-2 text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={`${approvedDaId} — quantities and net pricing are locked. Items cannot be added or removed.`}
        />
      ) : null}

      <ul className="order-items-list px-1 pb-1 pt-2" aria-label="Order items">
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} variant="detailed" />
        ))}
      </ul>
    </ModusWcCard>
  );
}
