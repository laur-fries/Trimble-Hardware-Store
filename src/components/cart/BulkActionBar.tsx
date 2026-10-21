import {
  ModusWcButton,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';

interface BulkActionBarProps {
  itemCount: number;
  onClearCart: () => void;
  disabled?: boolean;
}

export default function BulkActionBar({
  itemCount,
  onClearCart,
  disabled = false,
}: BulkActionBarProps) {
  const countLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ModusWcTypography
        hierarchy="p"
        size="sm"
        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
        label={countLabel}
      />
      <ModusWcButton
        className="cart-text-link-host"
        color="primary"
        variant="borderless"
        size="sm"
        customClass="cart-text-link"
        disabled={disabled}
        aria-label="Clear cart"
        onButtonClick={onClearCart}
      >
        Clear cart
      </ModusWcButton>
    </div>
  );
}
