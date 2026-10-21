import { useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcTypography,
  ModusWcUtilityPanel,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, useCart } from '../cart/CartContext';
import { getLineUnitPrice } from '../cart/bomHelpers';
import KitBadge from './KitBadge';

/**
 * Right-side cart drawer (overlay). Used on tablet/iPad (768–1199) when the
 * navbar cart icon is pressed — slides over catalog content with a dimmed
 * backdrop. Desktop uses the persistent shop cart rail; mobile uses the
 * sticky bottom bar.
 */
export default function CartPanel() {
  const navigate = useNavigate();
  const {
    items,
    count,
    subtotal,
    isOpen,
    increment,
    decrement,
    removeItem,
    closeCart,
  } = useCart();

  const goToCart = () => {
    closeCart();
    navigate('/cart');
  };

  const isEmpty = items.length === 0;

  return (
    <div
      className={`cart-panel-viewport${isOpen ? ' cart-panel-viewport--open' : ''}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="cart-panel-backdrop"
        hidden={!isOpen}
        aria-label="Close cart"
        onClick={closeCart}
      />

      <ModusWcUtilityPanel
        expanded={isOpen}
        pushContent={false}
        customClass="cart-panel"
        aria-label="Your cart summary"
        onPanelClosed={closeCart}
      >
        <div
          slot="header"
          className="flex w-full items-center justify-between gap-2"
        >
          <ModusWcTypography
            hierarchy="h2"
            size="sm"
            weight="semibold"
            label="Your cart summary"
          />
          <ModusWcButton
            color="tertiary"
            variant="borderless"
            shape="square"
            size="sm"
            aria-label="Close cart"
            onButtonClick={closeCart}
          >
            <ModusWcIcon name="close" size="sm" decorative />
          </ModusWcButton>
        </div>

        <div slot="body" className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center">
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
            </div>
            <ModusWcButton
              color="primary"
              variant="filled"
              size="md"
              fullWidth
              disabled={isEmpty}
              aria-label="Go to cart"
              onButtonClick={goToCart}
            >
              <ModusWcIcon name="shopping_cart" size="sm" decorative />
              Go to cart
            </ModusWcButton>
          </div>

          <ModusWcDivider />

          {isEmpty ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ModusWcIcon
                name="shopping_cart"
                size="lg"
                aria-label="Empty cart"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label="Your cart is empty."
              />
            </div>
          ) : (
            <ul className="cart-panel-lines">
              {items.map((line) => (
                <li key={line.product.id} className="cart-panel-line">
                  <div className="cart-panel-line-thumb" aria-hidden="true">
                    <img
                      src={line.product.image}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                  <div className="cart-panel-line-body min-w-0 flex-1">
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      weight="semibold"
                      customClass="line-clamp-2"
                      label={line.product.name}
                    />
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      weight="bold"
                      label={formatUsd(getLineUnitPrice(line))}
                    />
                    {line.product.isKit ? (
                      <div className="flex">
                        <KitBadge product={line.product} />
                      </div>
                    ) : null}
                    <div className="cart-panel-line-actions">
                      <div className="qty-stepper">
                        <ModusWcButton
                          variant="borderless"
                          color="tertiary"
                          shape="square"
                          size="xs"
                          aria-label={`Decrease quantity of ${line.product.name}`}
                          onButtonClick={() =>
                            line.quantity <= 1
                              ? removeItem(line.product.id)
                              : decrement(line.product.id)
                          }
                        >
                          <ModusWcIcon name="remove" size="xs" decorative />
                        </ModusWcButton>
                        <ModusWcTypography
                          hierarchy="p"
                          size="sm"
                          weight="semibold"
                          customClass="min-w-[1.5rem] text-center tabular-nums"
                          label={String(line.quantity)}
                        />
                        <ModusWcButton
                          variant="borderless"
                          color="tertiary"
                          shape="square"
                          size="xs"
                          aria-label={`Increase quantity of ${line.product.name}`}
                          onButtonClick={() => increment(line.product.id)}
                        >
                          <ModusWcIcon name="add" size="xs" decorative />
                        </ModusWcButton>
                      </div>
                      <ModusWcButton
                        color="danger"
                        variant="borderless"
                        size="sm"
                        aria-label={`Delete ${line.product.name} from cart`}
                        onButtonClick={() => removeItem(line.product.id)}
                      >
                        Delete
                      </ModusWcButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ModusWcUtilityPanel>
    </div>
  );
}
