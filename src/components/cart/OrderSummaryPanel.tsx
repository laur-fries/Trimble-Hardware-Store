import { useMemo, useState } from 'react';
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcTextInput,
  ModusWcTooltip,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, type CartLine } from '../../cart/CartContext';
import {
  buildOrderBreakdown,
  type OrderBreakdown,
} from '../../cart/orderPricing';
import { readInputString } from '../../utils/modusFormEvents';

const CHECKOUT_BLOCKED_TOOLTIP =
  'Resolve discontinued cart items to enable checkout.';
const CHECKOUT_BLOCKED_TOOLTIP_ID = 'cart-checkout-blocked-tooltip';

/** Demo promo codes accepted by the prototype. */
const VALID_PROMOS: Record<string, number> = {
  DEALER10: 0.1,
  FIELD5: 0.05,
  TRIMBLE250: 250,
};

interface OrderSummaryPanelProps {
  lines: CartLine[];
  itemCount: number;
  /** When true, checkout is blocked until discontinued lines are resolved. */
  checkoutBlocked?: boolean;
  onCheckout: () => void;
  onRequestDa: () => void;
  onSaveAsList: () => void;
  onDownloadQuote: () => void;
}

export default function OrderSummaryPanel({
  lines,
  itemCount,
  checkoutBlocked = false,
  onCheckout,
  onRequestDa,
  onSaveAsList,
  onDownloadQuote,
}: OrderSummaryPanelProps) {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const breakdown = useMemo(() => {
    const base = buildOrderBreakdown(lines, 0);
    const promoSavings = resolvePromoSavings(appliedPromo, base.dealerSubtotal);
    return buildOrderBreakdown(lines, promoSavings);
  }, [lines, appliedPromo]);

  const isEmpty = itemCount === 0;
  const checkoutDisabled = isEmpty || checkoutBlocked;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Enter a promo code');
      return;
    }
    if (!(code in VALID_PROMOS)) {
      setAppliedPromo(null);
      setPromoError('Invalid or expired promo code');
      return;
    }
    setAppliedPromo(code);
    setPromoError(null);
  };

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
          <PricingBreakdown
            breakdown={breakdown}
            appliedPromo={appliedPromo}
          />

          <div className="flex flex-col gap-2">
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              weight="semibold"
              label="Promo code"
            />
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <ModusWcTextInput
                  aria-label="Promo code"
                  placeholder="Enter promo code"
                  size="sm"
                  value={promoInput}
                  disabled={isEmpty}
                  onInputChange={(e: CustomEvent) => {
                    setPromoInput(readInputString(e));
                    setPromoError(null);
                  }}
                />
              </div>
              <ModusWcButton
                color="tertiary"
                variant="outlined"
                size="sm"
                disabled={isEmpty}
                aria-label="Apply promo code"
                onButtonClick={applyPromo}
              >
                Apply
              </ModusWcButton>
            </div>
            {promoError ? (
              <ModusWcTypography
                hierarchy="p"
                size="xs"
                customClass="text-[var(--modus-wc-color-error)]"
                label={promoError}
              />
            ) : null}
            <div className="flex justify-center">
              <ModusWcButton
                className="cart-text-link-host"
                color="primary"
                variant="borderless"
                size="sm"
                customClass="cart-text-link"
                disabled={isEmpty}
                aria-label="Request discretionary discount"
                onButtonClick={onRequestDa}
              >
                Request discretionary discount
              </ModusWcButton>
            </div>
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
              label={formatUsd(breakdown.netTotal)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <ModusWcTooltip
              content={CHECKOUT_BLOCKED_TOOLTIP}
              position="bottom"
              tooltipId={CHECKOUT_BLOCKED_TOOLTIP_ID}
              disabled={!checkoutBlocked}
            >
              <div className="cart-checkout-btn-host w-full">
                <ModusWcButton
                  color="primary"
                  variant="filled"
                  size="md"
                  fullWidth
                  disabled={checkoutDisabled}
                  aria-describedby={
                    checkoutBlocked ? CHECKOUT_BLOCKED_TOOLTIP_ID : undefined
                  }
                  aria-label={
                    checkoutBlocked
                      ? 'Proceed to checkout unavailable — resolve discontinued cart items'
                      : 'Proceed to checkout'
                  }
                  onButtonClick={onCheckout}
                >
                  <ModusWcIcon name="shopping_cart" size="sm" decorative />
                  Proceed to checkout
                </ModusWcButton>
              </div>
            </ModusWcTooltip>

            <ModusWcButton
              color="tertiary"
              variant="outlined"
              size="sm"
              fullWidth
              disabled={isEmpty}
              aria-label="Save cart as list"
              onButtonClick={onSaveAsList}
            >
              <ModusWcIcon name="save_as" size="xs" decorative />
              Save as list
            </ModusWcButton>

            <ModusWcButton
              color="tertiary"
              variant="outlined"
              size="sm"
              fullWidth
              disabled={isEmpty}
              aria-label="Download quote"
              onButtonClick={onDownloadQuote}
            >
              <ModusWcIcon name="download" size="xs" decorative />
              Download quote
            </ModusWcButton>
          </div>
        </div>
      </ModusWcCard>
    </aside>
  );
}

function resolvePromoSavings(
  appliedPromo: string | null,
  dealerSubtotal: number
): number {
  if (!appliedPromo) return 0;
  const rule = VALID_PROMOS[appliedPromo];
  if (rule == null) return 0;
  return rule < 1 ? dealerSubtotal * rule : rule;
}

function PricingBreakdown({
  breakdown,
  appliedPromo,
}: {
  breakdown: OrderBreakdown;
  appliedPromo: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SummaryRow
        label="Subtotal (MSRP)"
        value={formatUsd(breakdown.msrpSubtotal)}
      />
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
      {appliedPromo && breakdown.promoSavings > 0 ? (
        <SummaryRow
          label={`Promo (${appliedPromo})`}
          value={`−${formatUsd(breakdown.promoSavings)}`}
          discount
        />
      ) : null}
      <SummaryRow
        label="Estimated tax (8.25%)"
        value={formatUsd(breakdown.estimatedTax)}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  discount = false,
}: {
  label: string;
  value: string;
  discount?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <ModusWcTypography hierarchy="p" size="sm" label={label} />
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
