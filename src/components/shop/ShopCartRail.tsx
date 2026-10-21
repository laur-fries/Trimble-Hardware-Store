import { useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, useCart } from '../../cart/CartContext';
import { getLineUnitPrice } from '../../cart/bomHelpers';
import KitBadge from '../KitBadge';

/**
 * Persistent right-rail cart summary for Shop Hardware desktop (≥1200px).
 */
export default function ShopCartRail() {
  const navigate = useNavigate();
  const { items, count, subtotal, increment, decrement, removeItem } =
    useCart();
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return null;
  }

  return (
    <aside
      className="shop-cart-rail"
      aria-label="Your cart summary"
    >
      <ModusWcCard bordered={true} padding="compact" customClass="shop-cart-rail-card">
        <div slot="title">
          <ModusWcTypography
            hierarchy="h2"
            size="sm"
            weight="semibold"
            label="Your cart summary"
          />
        </div>

        <div className="flex flex-col gap-3 px-1 pb-1 pt-2">
          <div className="flex flex-col items-center gap-2 text-center">
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              weight="semibold"
              label="Subtotal"
            />
            <ModusWcTypography
              hierarchy="p"
              size="xl"
              weight="bold"
              label={formatUsd(subtotal)}
            />
            <ModusWcTypography
              hierarchy="p"
              size="xs"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label={`${count} ${count === 1 ? 'item' : 'items'} in cart`}
            />
            <ModusWcButton
              color="primary"
              variant="filled"
              size="md"
              fullWidth
              aria-label="Go to cart"
              onButtonClick={() => navigate('/cart')}
            >
              <ModusWcIcon name="shopping_cart" size="sm" decorative />
              Go to cart
            </ModusWcButton>
          </div>

          <ModusWcDivider />

          <ul className="shop-cart-rail-list">
            {items.map((line) => (
              <li key={line.product.id} className="shop-cart-rail-line">
                <div className="shop-cart-rail-thumb" aria-hidden="true">
                  <img src={line.product.image} alt="" loading="lazy" />
                </div>
                <div className="min-w-0 flex-1">
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    weight="bold"
                    customClass="part-number"
                    label={`PN: ${line.product.partNumber}`}
                  />
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    weight="semibold"
                    customClass="line-clamp-2"
                    label={line.product.name}
                  />
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                    label={formatUsd(getLineUnitPrice(line))}
                  />
                  {line.product.isKit ? (
                    <div className="mt-1 flex">
                      <KitBadge product={line.product} />
                    </div>
                  ) : null}
                  <div className="product-qty-stepper mt-1">
                    <ModusWcButton
                      color="tertiary"
                      variant="borderless"
                      shape="square"
                      size="sm"
                      customClass="product-qty-stepper-btn"
                      aria-label={`Decrease quantity of ${line.product.name}`}
                      onButtonClick={() =>
                        line.quantity <= 1
                          ? removeItem(line.product.id)
                          : decrement(line.product.id)
                      }
                    >
                      <ModusWcIcon
                        name={line.quantity <= 1 ? 'delete' : 'remove'}
                        size="xs"
                        decorative
                      />
                    </ModusWcButton>
                    <ModusWcTypography
                      hierarchy="p"
                      size="xs"
                      weight="semibold"
                      customClass="product-qty-stepper-label"
                      label={`${line.quantity} in cart`}
                    />
                    <ModusWcButton
                      color="tertiary"
                      variant="borderless"
                      shape="square"
                      size="sm"
                      customClass="product-qty-stepper-btn"
                      aria-label={`Increase quantity of ${line.product.name}`}
                      onButtonClick={() => increment(line.product.id)}
                    >
                      <ModusWcIcon name="add" size="xs" decorative />
                    </ModusWcButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ModusWcCard>
    </aside>
  );
}
