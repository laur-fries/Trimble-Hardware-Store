import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcIcon,
} from '@trimble-oss/moduswebcomponents-react';
import ProductCard from './ProductCard';
import SectionHeader from './SectionHeader';
import type { CatalogProduct } from '../catalogData';

interface ProductSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  products: CatalogProduct[];
  onAddToCart: (product: CatalogProduct) => void;
  /** Show the centered Browse Catalog link under the rail (mockup: New Hardware). */
  showBrowseCatalogLink?: boolean;
}

/**
 * Homepage product rail with carousel controls — reuses catalog ProductCards.
 */
export default function ProductSection({
  id,
  eyebrow,
  title,
  products,
  onAddToCart,
  showBrowseCatalogLink = false,
}: ProductSectionProps) {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLUListElement>(null);
  const headingId = `${id}-heading`;

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.85, 280);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <div id={headingId}>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          titleWeight="light"
          titleCustomClass="home-section-heading"
          actions={
            <>
              <ModusWcButton
                color="tertiary"
                variant="outlined"
                size="sm"
                shape="square"
                aria-label={`Previous ${eyebrow} items`}
                onButtonClick={() => scrollByPage(-1)}
              >
                <ModusWcIcon name="chevron_left" size="xs" decorative />
              </ModusWcButton>
              <ModusWcButton
                color="tertiary"
                variant="outlined"
                size="sm"
                shape="square"
                aria-label={`Next ${eyebrow} items`}
                onButtonClick={() => scrollByPage(1)}
              >
                <ModusWcIcon name="chevron_right" size="xs" decorative />
              </ModusWcButton>
            </>
          }
        />
      </div>

      <ul
        ref={scrollerRef}
        className="product-rail m-0 flex list-none gap-4 overflow-x-auto p-0 pb-1"
        aria-label={title}
      >
        {products.map((product) => (
          <li key={product.id} className="product-rail-item min-w-0 shrink-0">
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </li>
        ))}
      </ul>

      {showBrowseCatalogLink ? (
        <div className="flex justify-center">
          <ModusWcButton
            color="tertiary"
            variant="outlined"
            size="sm"
            aria-label="Browse full catalog"
            onButtonClick={() => navigate('/catalog')}
          >
            Browse Catalog
          </ModusWcButton>
        </div>
      ) : null}
    </section>
  );
}
