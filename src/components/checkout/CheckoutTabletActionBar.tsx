import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd } from '../../cart/CartContext';
import type { OrderHoldStatus } from '../../checkout/specialShippingInstructions';

interface CheckoutTabletActionBarProps {
  total: number;
  placing: boolean;
  disabled?: boolean;
  orderHoldStatus?: OrderHoldStatus;
  onPlaceOrder: () => void;
}

/** Sticky bottom CTA for tablet checkout (768px–1023px). */
export default function CheckoutTabletActionBar({
  total,
  placing,
  disabled = false,
  orderHoldStatus = 'NONE',
  onPlaceOrder,
}: CheckoutTabletActionBarProps) {
  const isManualReview = orderHoldStatus === 'MANUAL_SHIPPING_HOLD';
  const ctaLabel = placing
    ? isManualReview
      ? 'Submitting for review…'
      : 'Placing order…'
    : isManualReview
      ? 'Submit order for review'
      : 'Place order';

  return (
    <div
      className="checkout-tablet-action-bar"
      role="region"
      aria-label="Checkout actions"
    >
      <div className="checkout-tablet-action-bar-inner">
        <div className="checkout-tablet-action-bar-total">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label="Total"
          />
          <ModusWcTypography
            hierarchy="p"
            size="lg"
            weight="bold"
            customClass="tabular-nums"
            label={formatUsd(total)}
          />
        </div>
        <ModusWcButton
          color="primary"
          variant="filled"
          size="md"
          customClass="checkout-tablet-action-bar-cta"
          disabled={disabled || placing}
          aria-label={ctaLabel}
          onButtonClick={onPlaceOrder}
        >
          <ModusWcIcon
            name={placing ? 'refresh' : isManualReview ? 'document' : 'check_circle'}
            size="sm"
            decorative
          />
          {ctaLabel}
        </ModusWcButton>
      </div>
    </div>
  );
}
