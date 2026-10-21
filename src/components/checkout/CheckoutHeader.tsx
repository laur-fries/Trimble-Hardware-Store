import { useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';

interface CheckoutHeaderProps {
  frozen?: boolean;
  backTo?: string;
  backLabel?: string;
}

export default function CheckoutHeader({
  frozen = false,
  backTo = '/cart',
  backLabel = 'Back to cart',
}: CheckoutHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col gap-3">
      <ModusWcButton
        className="cart-text-link-host w-fit"
        color="primary"
        variant="borderless"
        size="sm"
        customClass="cart-text-link"
        aria-label={backLabel}
        onButtonClick={() => navigate(backTo)}
      >
        <ModusWcIcon name="arrow_left" size="xs" decorative />
        {backLabel}
      </ModusWcButton>

      <ModusWcTypography
        hierarchy="h1"
        size="2xl"
        weight="semibold"
        label="Checkout"
      />

      {frozen ? (
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Approved discretionary discount cart — line items are frozen. Enter Dealer PO # and Billing Contact to convert to a sales order."
        />
      ) : null}
    </header>
  );
}
