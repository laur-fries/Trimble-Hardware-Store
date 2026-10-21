import {
  ModusWcAlert,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, type CartLine } from '../../cart/CartContext';
import {
  getCartPriceChanges,
  type CartPriceChange,
} from '../../cart/priceChanges';

interface CartPriceChangeAlertProps {
  items: CartLine[];
}

function PriceAmount({ amount }: { amount: number }) {
  return <span className="cart-price-amount">{formatUsd(amount)}</span>;
}

function PriceChangeLine({ change }: { change: CartPriceChange }) {
  return (
    <li className="cart-price-change-item">
      <ModusWcTypography hierarchy="p" size="sm" customClass="cart-price-change-copy">
        <strong>
          {change.name} (PN {change.partNumber})
        </strong>{' '}
        has {change.direction} from{' '}
        <PriceAmount amount={change.previousPrice} /> to{' '}
        <PriceAmount amount={change.currentPrice} />
      </ModusWcTypography>
    </li>
  );
}

/**
 * Cart-level price-change alert: title + bullet list of every SKU whose
 * dealer net moved since add (increases and decreases).
 */
export default function CartPriceChangeAlert({
  items,
}: CartPriceChangeAlertProps) {
  const changes = getCartPriceChanges(items);
  if (changes.length === 0) return null;

  // Match prototype copy (plural uses “has” per design mock).
  const title =
    changes.length === 1
      ? '1 item in your cart has changed price'
      : `${changes.length} items in your cart has changed price`;

  return (
    <ModusWcAlert
      variant="warning"
      icon="info"
      role="status"
      customClass="cart-price-change-alert"
    >
      <div slot="content" className="cart-price-change-content">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="semibold"
          customClass="cart-price-change-title"
          label={title}
        />
        <ul className="cart-price-change-list">
          {changes.map((change) => (
            <PriceChangeLine key={change.productId} change={change} />
          ))}
        </ul>
      </div>
    </ModusWcAlert>
  );
}
