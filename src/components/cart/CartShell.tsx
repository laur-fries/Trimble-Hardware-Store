import { ModusWcTypography } from '@trimble-oss/moduswebcomponents-react';
import { formatUsd } from '../../cart/CartContext';
import type { CartLine } from '../../cart/CartContext';
import { getLineTotal } from '../../cart/bomHelpers';
import { resolveReplacementProduct } from '../../catalog/discontinuation';
import type { CatalogProduct } from '../../catalogData';
import BulkActionBar from './BulkActionBar';
import CartDiscontinuedAlert from './CartDiscontinuedAlert';
import CartItemCard from './CartItemCard';
import CartPriceChangeAlert from './CartPriceChangeAlert';

interface CartShellProps {
  items: CartLine[];
  onClearCart: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onReplaceDiscontinued: (
    discontinuedProductId: string,
    replacement: CatalogProduct
  ) => void;
}

/**
 * Outer “Cart” panel: title, clear action, line cards, and cart subtotal footer.
 */
export default function CartShell({
  items,
  onClearCart,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
  onReplaceDiscontinued,
}: CartShellProps) {
  const itemCount = items.reduce((total, line) => total + line.quantity, 0);
  const subtotal = items.reduce((total, line) => total + getLineTotal(line), 0);

  return (
    <section aria-label="Cart" className="cart-shell flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <ModusWcTypography
          hierarchy="h2"
          size="xl"
          weight="semibold"
          label="Cart"
        />

        <BulkActionBar itemCount={itemCount} onClearCart={onClearCart} />
      </div>

      <CartDiscontinuedAlert items={items} />
      <CartPriceChangeAlert items={items} />

      <ul className="flex flex-col gap-3">
        {items.map((line) => (
          <li key={line.product.id}>
            <CartItemCard
              line={line}
              onIncrement={() => onIncrement(line.product.id)}
              onDecrement={() => onDecrement(line.product.id)}
              onSetQuantity={(qty) => onSetQuantity(line.product.id, qty)}
              onRemove={() => onRemove(line.product.id)}
              onReplaceDiscontinued={() => {
                const replacement = resolveReplacementProduct(line.product);
                if (replacement) {
                  onReplaceDiscontinued(line.product.id, replacement);
                }
              }}
            />
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-end gap-2 border-t border-[var(--modus-wc-color-base-200)] pt-4">
        <ModusWcTypography
          hierarchy="p"
          size="md"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Subtotal"
        />
        <ModusWcTypography
          hierarchy="p"
          size="lg"
          weight="bold"
          customClass="tabular-nums"
          label={formatUsd(subtotal)}
        />
      </div>
    </section>
  );
}
