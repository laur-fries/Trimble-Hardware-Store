import { Link } from 'react-router-dom';
import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import {
  getTopFrequentlyPurchased,
  type FrequentlyPurchasedItem,
} from '../../cart/frequentlyPurchased';
import { productDetailPath } from '../../catalog/productLookup';
import type { CatalogProduct } from '../../catalogData';
import ProductImage from '../ProductImage';

interface FrequentlyPurchasedSectionProps {
  onAddToCart: (product: CatalogProduct) => void;
}

function formatTimesPurchased(count: number): string {
  return `Purchased ${count.toLocaleString('en-US')}×`;
}

function FrequentlyPurchasedCard({
  item,
  onAddToCart,
}: {
  item: FrequentlyPurchasedItem;
  onAddToCart: (product: CatalogProduct) => void;
}) {
  const { product, timesPurchased } = item;

  return (
    <ModusWcCard bordered={true} padding="compact" customClass="h-full">
      <div slot="header">
        <Link
          to={productDetailPath(product)}
          className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--modus-wc-color-primary)]"
          aria-label={`View ${product.name}`}
        >
          <ProductImage src={product.image} alt="" />
        </Link>
      </div>

      <div className="flex flex-col gap-2 px-1 pb-1 pt-1">
        <ModusWcBadge variant="filled" size="sm">
          {formatTimesPurchased(timesPurchased)}
        </ModusWcBadge>

        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="part-number"
          label={`PN: ${product.partNumber}`}
        />

        <Link
          to={productDetailPath(product)}
          className="product-title-link min-w-0"
        >
          <ModusWcTypography
            hierarchy="h3"
            size="sm"
            weight="semibold"
            customClass="line-clamp-2"
            label={product.name}
          />
        </Link>

        <ModusWcTypography
          hierarchy="p"
          size="md"
          weight="bold"
          label={product.price}
        />
      </div>

      <div slot="footer" className="px-4 pb-4">
        <ModusWcButton
          color="neutral"
          variant="filled"
          size="sm"
          fullWidth
          aria-label={`Quick add ${product.name} to cart`}
          onButtonClick={() => onAddToCart(product)}
        >
          <ModusWcIcon name="shopping_cart" size="xs" decorative />
          Add to cart
        </ModusWcButton>
      </div>
    </ModusWcCard>
  );
}

/**
 * Amazon-style empty-cart recommendations: top org purchases with quick add.
 */
export default function FrequentlyPurchasedSection({
  onAddToCart,
}: FrequentlyPurchasedSectionProps) {
  const items = getTopFrequentlyPurchased(5);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="frequently-purchased-heading"
      className="flex flex-col gap-4 pt-2"
    >
      <div className="flex flex-col gap-1">
        <div id="frequently-purchased-heading">
          <ModusWcTypography
            hierarchy="h2"
            size="xl"
            weight="semibold"
            label="Frequently purchased"
          />
        </div>
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Top hardware your organization orders most often — add to cart in one click."
        />
      </div>

      <ul className="frequently-purchased-grid m-0 list-none p-0">
        {items.map((item) => (
          <li key={item.product.id} className="min-w-0">
            <FrequentlyPurchasedCard item={item} onAddToCart={onAddToCart} />
          </li>
        ))}
      </ul>
    </section>
  );
}
