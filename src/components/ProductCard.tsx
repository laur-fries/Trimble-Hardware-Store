import { Link, useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTooltip,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { isDiscontinuedProduct } from '../catalog/discontinuation';
import { productDetailPath } from '../catalog/productLookup';
import DiscontinuedBadge from './DiscontinuedBadge';
import KitBadge from './KitBadge';
import ProductImage from './ProductImage';
import { resolveListPrice, type CatalogProduct } from '../catalogData';

/**
 * Splits a display price like "$1,180.00" into the whole-dollar part
 * ("$1,180") and the cents ("00") so cents can render smaller and stacked
 * next to the dollar amount instead of inline at full size.
 */
function splitPrice(price: string): { dollars: string; cents: string } {
  const match = price.match(/^(.*)\.(\d{2})$/);
  if (!match) return { dollars: price, cents: '' };
  return { dollars: match[1], cents: match[2] };
}

interface ProductCardProps {
  product: CatalogProduct;
  /** Quantity already in the cart (0 = show Add to cart). */
  cartQuantity?: number;
  /** Adds the product to the order (dealer cart). */
  onAddToCart?: (product: CatalogProduct) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export default function ProductCard({
  product,
  cartQuantity = 0,
  onAddToCart,
  onIncrement,
  onDecrement,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { dollars, cents } = splitPrice(product.price);
  const listPrice = resolveListPrice(product);
  const detailPath = productDetailPath(product);
  const discontinued = isDiscontinuedProduct(product);
  const replacement = product.replacementProduct;
  const inCart = !discontinued && cartQuantity > 0;

  const goToReplacement = () => {
    if (!replacement) return;
    navigate(productDetailPath({ id: replacement.id }));
  };

  return (
    <ModusWcCard
      bordered={true}
      padding="compact"
      customClass={
        discontinued ? 'product-card product-card--discontinued' : 'product-card'
      }
      className="product-card-host"
    >
      <div slot="header">
        <Link
          to={detailPath}
          className="product-card-image-link"
          tabIndex={-1}
          aria-hidden="true"
        >
          <ProductImage src={product.image} alt="" />
        </Link>
      </div>

      <div className="product-card-body flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="part-number"
            label={`PN: ${product.partNumber}`}
          />
          {discontinued ? (
            <DiscontinuedBadge />
          ) : (
            <KitBadge product={product} />
          )}
        </div>

        <ModusWcTooltip content={product.name} position="auto">
          <ModusWcTypography
            hierarchy="h3"
            size="md"
            weight="semibold"
            customClass="line-clamp-2"
          >
            <Link to={detailPath} className="product-card-title-link">
              {product.name}
            </Link>
          </ModusWcTypography>
        </ModusWcTooltip>

        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="line-clamp-2 text-[var(--modus-wc-color-base-content-low-contrast)]"
        >
          {product.description}
        </ModusWcTypography>

        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1">
          <div
            className={
              discontinued
                ? 'flex items-start line-through text-[var(--modus-wc-color-base-content-low-contrast)]'
                : 'flex items-start'
            }
          >
            <ModusWcTypography
              hierarchy="p"
              size="xl"
              weight="bold"
              label={dollars}
            />
            {cents ? (
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                weight="bold"
                label={cents}
              />
            ) : null}
          </div>
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)] line-through"
            label={`List price: ${listPrice}`}
          />
        </div>
      </div>

      <div
        slot="footer"
        className="product-card-footer flex flex-col gap-2 px-4 pb-4"
      >
        {discontinued ? (
          replacement ? (
            <ModusWcButton
              color="tertiary"
              variant="outlined"
              size="sm"
              fullWidth
              customClass="product-card-touch-btn"
              aria-label={`View replacement part ${replacement.partNumber}`}
              onButtonClick={goToReplacement}
            >
              View replacement
              <ModusWcIcon name="arrow_right" size="xs" decorative />
            </ModusWcButton>
          ) : (
            <ModusWcButton
              color="tertiary"
              variant="outlined"
              size="sm"
              fullWidth
              disabled
              customClass="product-card-touch-btn"
              aria-label="Item discontinued"
            >
              Item Discontinued
            </ModusWcButton>
          )
        ) : (
          <>
            <div
              className="product-card-cart-action"
              hidden={inCart}
              aria-hidden={inCart}
            >
              <ModusWcButton
                color="neutral"
                variant="filled"
                size="sm"
                fullWidth
                customClass="product-card-touch-btn"
                aria-label={`Add ${product.name} to cart`}
                onButtonClick={() => onAddToCart?.(product)}
              >
                <ModusWcIcon name="shopping_cart" size="xs" decorative />
                Add to cart
              </ModusWcButton>
            </div>

            <div
              className="product-qty-stepper product-qty-stepper--card"
              hidden={!inCart}
              aria-hidden={!inCart}
            >
              <ModusWcButton
                color="tertiary"
                variant="borderless"
                shape="square"
                size="sm"
                customClass="product-qty-stepper-btn"
                aria-label={
                  cartQuantity <= 1
                    ? `Remove ${product.name} from cart`
                    : `Decrease quantity of ${product.name}`
                }
                onButtonClick={() => onDecrement?.()}
              >
                <ModusWcIcon
                  name={cartQuantity <= 1 ? 'delete' : 'remove'}
                  size="xs"
                  decorative
                />
              </ModusWcButton>
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                weight="semibold"
                customClass="product-qty-stepper-label"
                label={`${cartQuantity} in cart`}
              />
              <ModusWcButton
                color="tertiary"
                variant="borderless"
                shape="square"
                size="sm"
                customClass="product-qty-stepper-btn"
                aria-label={`Increase quantity of ${product.name}`}
                onButtonClick={() => onIncrement?.()}
              >
                <ModusWcIcon name="add" size="xs" decorative />
              </ModusWcButton>
            </div>
          </>
        )}
      </div>
    </ModusWcCard>
  );
}
