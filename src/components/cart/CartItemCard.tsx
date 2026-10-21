import { useMemo } from 'react';
import {
  ModusWcAlert,
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcNumberInput,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { CartLine } from '../../cart/CartContext';
import { formatUsd } from '../../cart/CartContext';
import { getLineTotal, getLineUnitPrice } from '../../cart/bomHelpers';
import {
  isDiscontinuedProduct,
  resolveReplacementProduct,
} from '../../catalog/discontinuation';
import type { StockStatus } from '../../catalogData';
import { productDetailPath } from '../../catalog/productLookup';
import { readInputString } from '../../utils/modusFormEvents';
import ProductTitleLink from '../ProductTitleLink';
import CartLineBomAccordion from './CartLineBomAccordion';
import DiscontinuedBadge from '../DiscontinuedBadge';
import {
  getKitStockRollup,
  getUniversalProductBom,
} from '../../catalog/productBom';
import KitStockRollupBadge from './KitStockRollupBadge';

const stockMap: Record<
  StockStatus,
  { color: 'success' | 'warning' | 'danger'; icon: string; label: string; available: number }
> = {
  'in-stock': {
    color: 'success',
    icon: 'check_circle',
    label: 'Plenty in stock',
    available: 99,
  },
  limited: {
    color: 'warning',
    icon: 'warning',
    label: 'Limited availability',
    available: 20,
  },
  'out-of-stock': {
    color: 'danger',
    icon: 'cancel_circle',
    label: 'Out of stock',
    available: 0,
  },
};

function splitPrice(price: string): { dollars: string; cents: string } {
  const match = price.match(/^(.*)\.(\d{2})$/);
  if (!match) return { dollars: price, cents: '' };
  return { dollars: match[1], cents: match[2] };
}

interface CartItemCardProps {
  line: CartLine;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetQuantity: (quantity: number) => void;
  onRemove: () => void;
  onReplaceDiscontinued?: () => void;
}

function CartLineQtyRow({
  productName,
  quantity,
  onDecrement,
  onIncrement,
  onSetQuantity,
  onRemove,
  qtyDisabled = false,
}: {
  productName: string;
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onSetQuantity: (quantity: number) => void;
  onRemove: () => void;
  qtyDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className={qtyDisabled ? 'qty-stepper qty-stepper--disabled' : 'qty-stepper'}
      >
        <ModusWcButton
          variant="borderless"
          color="tertiary"
          shape="square"
          size="xs"
          disabled={qtyDisabled}
          aria-label={`Decrease quantity of ${productName}`}
          onButtonClick={onDecrement}
        >
          <ModusWcIcon name="remove" size="xs" decorative />
        </ModusWcButton>

        <div className="cart-qty-field">
          <ModusWcNumberInput
            aria-label={`Quantity for ${productName}`}
            size="sm"
            min={1}
            step={1}
            disabled={qtyDisabled}
            value={String(quantity)}
            onInputChange={(e: CustomEvent) => {
              const next = Number(readInputString(e));
              if (!Number.isNaN(next)) onSetQuantity(next);
            }}
          />
        </div>

        <ModusWcButton
          variant="borderless"
          color="tertiary"
          shape="square"
          size="xs"
          disabled={qtyDisabled}
          aria-label={`Increase quantity of ${productName}`}
          onButtonClick={onIncrement}
        >
          <ModusWcIcon name="add" size="xs" decorative />
        </ModusWcButton>
      </div>

      <ModusWcButton
        variant="borderless"
        color="danger"
        size="sm"
        aria-label={`Delete ${productName} from cart`}
        onButtonClick={onRemove}
      >
        Delete
      </ModusWcButton>
    </div>
  );
}

export default function CartItemCard({
  line,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
  onReplaceDiscontinued,
}: CartItemCardProps) {
  const { product, quantity } = line;
  const isKit = Boolean(product.isKit);
  const bomItems = useMemo(() => getUniversalProductBom(product), [product]);
  const stock = stockMap[product.stock];
  const isOutOfStock = product.stock === 'out-of-stock';
  const discontinued = isDiscontinuedProduct(product);
  const replacementRef = product.replacementProduct;
  const replacement = resolveReplacementProduct(product);
  const overStock =
    !isKit && !discontinued && quantity > stock.available && stock.available > 0;
  const lineTotalAmount = getLineTotal(line);
  const unitPriceAmount = getLineUnitPrice(line);
  const lineTotal = formatUsd(lineTotalAmount);
  const unitPrice = formatUsd(unitPriceAmount);
  const { dollars, cents } = splitPrice(lineTotal);

  return (
    <ModusWcCard
      bordered={true}
      padding="compact"
      customClass={
        discontinued
          ? 'cart-line-card cart-line-card--discontinued'
          : 'cart-line-card'
      }
    >
      <div
        className={
          discontinued
            ? 'cart-line-discontinued-inner flex flex-col gap-4 p-1 sm:p-2'
            : 'flex flex-col gap-4 p-1 sm:p-2'
        }
      >
        {discontinued ? (
          <div className="cart-line-discontinued-header">
            <DiscontinuedBadge />
            {replacementRef && replacement ? (
              <ModusWcButton
                color="neutral"
                variant="filled"
                size="sm"
                customClass="cart-line-replace-btn"
                aria-label={`Replace with part number ${replacementRef.partNumber}`}
                onButtonClick={() => onReplaceDiscontinued?.()}
              >
                Replace with PN: {replacementRef.partNumber} ({replacementRef.price})
              </ModusWcButton>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="cart-thumb shrink-0" aria-hidden="true">
            <img src={product.image} alt="" loading="lazy" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  weight="bold"
                  customClass="part-number"
                  label={`PN: ${product.partNumber}`}
                />
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <ProductTitleLink
                    to={productDetailPath(product)}
                    name={product.name}
                    hierarchy="h3"
                    size="md"
                    weight="semibold"
                  />
                  {isKit ? (
                    <ModusWcBadge
                      variant="filled"
                      color="primary"
                      size="sm"
                      customClass="kit-badge-dark"
                    >
                      BUNDLED KIT
                    </ModusWcBadge>
                  ) : null}
                </div>
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  customClass="line-clamp-2 text-[var(--modus-wc-color-base-content-low-contrast)]"
                >
                  {product.description}
                </ModusWcTypography>
                {!isKit && !discontinued ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <ModusWcBadge variant="text" color={stock.color} size="sm">
                      <ModusWcIcon name={stock.icon} size="xs" decorative />
                      {stock.label}
                    </ModusWcBadge>
                    {isOutOfStock ? (
                      <ModusWcTypography
                        hierarchy="p"
                        size="xs"
                        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                        label="Backorder available — we'll email you when it's ready to ship."
                      />
                    ) : null}
                    {overStock ? (
                      <ModusWcTypography
                        hierarchy="p"
                        size="xs"
                        customClass="text-[var(--modus-wc-color-error)]"
                        label={`Only ${stock.available} available in fulfillment center`}
                      />
                    ) : null}
                  </div>
                ) : null}
                {isKit && !discontinued ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <KitStockRollupBadge status={getKitStockRollup(bomItems)} />
                  </div>
                ) : null}
              </div>

              <div
                className="flex shrink-0 flex-col items-end gap-0.5"
                aria-label={`Line total ${lineTotal}`}
              >
                <div className="flex items-start">
                  <ModusWcTypography hierarchy="p" size="xl" weight="bold" label={dollars} />
                  {cents ? (
                    <ModusWcTypography hierarchy="p" size="sm" weight="bold" label={cents} />
                  ) : null}
                </div>
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="tabular-nums text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={`${unitPrice} each`}
                />
              </div>
            </div>
          </div>
        </div>

        {discontinued && !replacement ? (
          <div className="flex flex-col gap-2">
            <ModusWcAlert
              variant="error"
              icon="alert"
              role="status"
              alertTitle="Discontinued — No direct replacement available"
            />
            <ModusWcButton
              color="danger"
              variant="outlined"
              size="sm"
              aria-label={`Remove ${product.name} from cart`}
              onButtonClick={onRemove}
            >
              <ModusWcIcon name="delete" size="xs" decorative />
              Remove item
            </ModusWcButton>
          </div>
        ) : (
          <CartLineQtyRow
            productName={product.name}
            quantity={quantity}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            onSetQuantity={onSetQuantity}
            onRemove={onRemove}
            qtyDisabled={discontinued}
          />
        )}

        {bomItems.length > 0 ? (
          <CartLineBomAccordion
            product={product}
            isKit={isKit}
            bomItems={bomItems}
          />
        ) : null}
      </div>
    </ModusWcCard>
  );
}
