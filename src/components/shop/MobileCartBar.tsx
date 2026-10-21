import { useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, useCart } from '../../cart/CartContext';

/**
 * Sticky bottom cart bar for Shop Hardware on medium / small / xs (&lt;1200px)
 * when the cart has items. Header cart icon and this CTA both go to `/cart`.
 */
export default function MobileCartBar() {
  const navigate = useNavigate();
  const { count, subtotal, items } = useCart();

  if (items.length === 0) return null;

  return (
    <div className="shop-mobile-cart-bar" role="region" aria-label="Cart summary">
      <div className="shop-mobile-cart-bar-inner">
        <div className="shop-mobile-cart-bar-meta">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label={`${count} ${count === 1 ? 'item' : 'items'} (${formatUsd(subtotal)})`}
          />
        </div>
        <ModusWcButton
          color="primary"
          variant="filled"
          size="sm"
          customClass="shop-mobile-cart-bar-cta"
          aria-label="Go to cart"
          onButtonClick={() => navigate('/cart')}
        >
          <ModusWcIcon name="shopping_cart" size="xs" decorative />
          Go to cart
        </ModusWcButton>
      </div>
    </div>
  );
}
