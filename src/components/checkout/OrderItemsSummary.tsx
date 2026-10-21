import { useMemo, useState } from 'react';
import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { cartLinesToOrderLineItems } from '../../checkout/orderLineItems';
import type { CartLine } from '../../cart/CartContext';
import { getLineTotal } from '../../cart/bomHelpers';
import OrderDetailDrawer, {
  type OrderDetailSubject,
} from '../orders/OrderDetailDrawer';
import OrderItemRow from './OrderItemRow';

interface OrderItemsSummaryProps {
  lines: CartLine[];
  frozen?: boolean;
  approvedDaId?: string;
}

const PREVIEW_LIMIT = 5;

/**
 * High-density checkout order-items preview: top lines by net total + drawer CTA.
 */
export default function OrderItemsSummary({
  lines,
  frozen = false,
  approvedDaId,
}: OrderItemsSummaryProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const lineCount = lines.length;

  const topItems = useMemo(() => {
    const sorted = [...lines].sort(
      (a, b) => getLineTotal(b) - getLineTotal(a)
    );
    return cartLinesToOrderLineItems(sorted.slice(0, PREVIEW_LIMIT));
  }, [lines]);

  const remainingCount = Math.max(0, lineCount - PREVIEW_LIMIT);

  const subject: OrderDetailSubject = useMemo(
    () => ({
      kind: 'checkout-lines',
      lines,
      title: 'Order items',
      frozen,
      approvedDaId,
    }),
    [lines, frozen, approvedDaId]
  );

  const openDrawer = () => setDrawerOpen(true);

  return (
    <div className="order-items-summary-section min-w-0">
      <ModusWcCard
        bordered={true}
        padding="compact"
        customClass="order-items-summary-card"
      >
        <div className="order-items-summary flex flex-col gap-3">
          <div className="order-items-summary-header">
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <ModusWcTypography
                hierarchy="h2"
                size="lg"
                weight="semibold"
                label={`Order items (${lineCount})`}
              />
              {frozen ? (
                <ModusWcBadge variant="filled" color="success" size="sm">
                  Approved DA
                </ModusWcBadge>
              ) : null}
            </div>

            <ModusWcButton
              className="cart-text-link-host"
              color="primary"
              variant="borderless"
              size="sm"
              customClass="cart-text-link"
              aria-label="View all order items"
              onButtonClick={openDrawer}
            >
              View all items
              <ModusWcIcon name="arrow_right" size="xs" decorative />
            </ModusWcButton>
          </div>

          {lineCount === 0 ? (
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label="No items in this order."
            />
          ) : (
            <div
              className="order-items-mini-table"
              role="table"
              aria-label="Highest-value order lines preview"
            >
              <ul className="order-items-list">
                {topItems.map((item) => (
                  <OrderItemRow key={item.id} item={item} variant="summary" />
                ))}
              </ul>
            </div>
          )}

          <div
            className="order-items-summary-more"
            hidden={remainingCount === 0}
            aria-hidden={remainingCount === 0}
          >
            <ModusWcButton
              className="cart-text-link-host"
              color="tertiary"
              variant="borderless"
              size="sm"
              customClass="cart-text-link order-items-more-link"
              aria-label={`View ${remainingCount} additional items in drawer`}
              onButtonClick={openDrawer}
            >
              {`+ ${remainingCount} items`}
            </ModusWcButton>
          </div>
        </div>
      </ModusWcCard>

      <OrderDetailDrawer
        open={drawerOpen}
        subject={drawerOpen ? subject : null}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
