import { useMemo } from 'react';
import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, type CartLine } from '../../cart/CartContext';
import { buildOrderBreakdown } from '../../cart/orderPricing';
import type { OrderHoldStatus } from '../../checkout/specialShippingInstructions';

interface OrderSummarySidebarProps {
  lines: CartLine[];
  placing: boolean;
  disabled?: boolean;
  orderHoldStatus?: OrderHoldStatus;
  approvedDa?: { id: string; approvedNetTotal: number };
  onRequestDa?: () => void;
  onPlaceOrder: () => void;
}

export default function OrderSummarySidebar({
  lines,
  placing,
  disabled = false,
  orderHoldStatus = 'NONE',
  approvedDa,
  onRequestDa,
  onPlaceOrder,
}: OrderSummarySidebarProps) {
  const breakdown = useMemo(() => buildOrderBreakdown(lines), [lines]);
  const total = approvedDa?.approvedNetTotal ?? breakdown.netTotal;
  const isManualReview = orderHoldStatus === 'MANUAL_SHIPPING_HOLD';

  const ctaLabel = placing
    ? isManualReview
      ? 'Submitting for review…'
      : 'Placing order…'
    : isManualReview
      ? 'Submit order for review'
      : 'Place order';

  const ctaAria = isManualReview
    ? 'Submit order for review'
    : 'Place order';

  return (
    <aside
      role="region"
      aria-label="Order summary"
      className="lg:sticky lg:top-20"
    >
      <ModusWcCard bordered={true} padding="comfortable">
        <div slot="title">
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label="Order summary"
          />
        </div>

        <div className="flex flex-col gap-4 px-1 pb-1 pt-3">
          {approvedDa ? (
            <ModusWcBadge variant="filled" color="success" size="sm">
              Approved Discretionary Discount Applied
            </ModusWcBadge>
          ) : null}

          {isManualReview ? (
            <ModusWcBadge variant="filled" color="warning" size="sm">
              Manual shipping hold
            </ModusWcBadge>
          ) : null}

          <div className="flex flex-col gap-2">
            <SummaryRow
              label="Subtotal (MSRP)"
              value={formatUsd(breakdown.msrpSubtotal)}
            />
            {approvedDa ? (
              <SummaryRow
                label={`Approved DA net (${approvedDa.id})`}
                value={formatUsd(approvedDa.approvedNetTotal)}
                muted
              />
            ) : (
              <>
                <SummaryRow
                  label="Dealer discount (10%)"
                  value={`−${formatUsd(breakdown.standardDiscount)}`}
                  discount
                />
                <SummaryRow
                  label="KPI discount (2%)"
                  value={`−${formatUsd(breakdown.kpiDiscount)}`}
                  discount
                />
                <SummaryRow
                  label="Estimated tax (8.25%)"
                  value={formatUsd(breakdown.estimatedTax)}
                />
              </>
            )}
          </div>

          <ModusWcDivider />

          <div className="flex items-baseline justify-between gap-3">
            <ModusWcTypography
              hierarchy="p"
              size="md"
              weight="semibold"
              label="Total"
            />
            <ModusWcTypography
              hierarchy="p"
              size="xl"
              weight="bold"
              customClass="tabular-nums"
              label={formatUsd(total)}
            />
          </div>

          <ModusWcButton
            color="primary"
            variant="filled"
            size="md"
            fullWidth
            disabled={disabled || placing || lines.length === 0}
            aria-label={ctaAria}
            onButtonClick={onPlaceOrder}
          >
            <ModusWcIcon
              name={placing ? 'refresh' : isManualReview ? 'document' : 'check_circle'}
              size="sm"
              decorative
            />
            {ctaLabel}
          </ModusWcButton>

          {onRequestDa ? (
            <ModusWcButton
              color="tertiary"
              variant="outlined"
              size="sm"
              fullWidth
              disabled={placing || lines.length === 0}
              aria-label="Request Discretionary Discount (DA)"
              onButtonClick={onRequestDa}
            >
              <ModusWcIcon name="calculate" size="xs" decorative />
              Request Discretionary Discount (DA)
            </ModusWcButton>
          ) : null}

          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="text-center text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={
              isManualReview
                ? 'This order will be held for manual review before fulfillment.'
                : 'By placing this order, you agree to Trimble B2B Commercial Terms & Conditions.'
            }
          />
        </div>
      </ModusWcCard>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
  discount = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  discount?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <ModusWcTypography
        hierarchy="p"
        size="sm"
        customClass={
          muted
            ? 'text-[var(--modus-wc-color-base-content-low-contrast)]'
            : undefined
        }
        label={label}
      />
      <ModusWcTypography
        hierarchy="p"
        size="sm"
        weight="semibold"
        customClass={
          discount
            ? 'tabular-nums text-[var(--modus-wc-color-error)]'
            : 'tabular-nums'
        }
        label={value}
      />
    </div>
  );
}
