import { useRef, useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { CatalogProduct } from '../../catalogData';
import {
  getProductOverviewCopy,
  type ProductOverviewFeature,
} from '../../catalog/productOverviewCopy';
import ProductCard from '../ProductCard';

type ProductOverviewTabContentProps = {
  product: CatalogProduct;
  related: CatalogProduct[];
  onAddToCart: (product: CatalogProduct) => void;
};

export default function ProductOverviewTabContent({
  product,
  related,
  onAddToCart,
}: ProductOverviewTabContentProps) {
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const railRef = useRef<HTMLUListElement>(null);
  const copy = getProductOverviewCopy(product);
  const hasMoreSummary = Boolean(copy.summaryMore);
  const visibleFeatures =
    featuresExpanded || copy.features.length <= 3
      ? copy.features
      : copy.features.slice(0, 3);
  const featuresFade =
    !featuresExpanded && copy.features.length > 3 && visibleFeatures.length >= 3;

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const delta = direction * Math.max(280, rail.clientWidth * 0.85);
    rail.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="product-detail-overview">
      <ModusWcTypography
        hierarchy="h2"
        size="lg"
        weight="semibold"
        label="Product Overview"
      />

      <div className="product-detail-overview-summary">
        <ModusWcTypography
          hierarchy="p"
          size="md"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={
            overviewExpanded || !hasMoreSummary
              ? `${copy.summaryLead}${copy.summaryMore ?? ''}`
              : copy.summaryLead
          }
        />
        {hasMoreSummary ? (
          <ModusWcButton
            color="primary"
            variant="borderless"
            size="sm"
            customClass="product-detail-show-more"
            aria-expanded={overviewExpanded}
            onButtonClick={() => setOverviewExpanded((open) => !open)}
          >
            {overviewExpanded ? 'Show less' : 'Show more'}
          </ModusWcButton>
        ) : null}
      </div>

      {copy.features.length > 0 ? (
        <div className="product-detail-overview-features">
          <ModusWcTypography
            hierarchy="h3"
            size="md"
            weight="semibold"
            label="Features"
          />
          <div
            className={
              featuresFade
                ? 'product-detail-features-list product-detail-features-list--fade'
                : 'product-detail-features-list'
            }
          >
            <ul className="product-detail-feature-items">
              {visibleFeatures.map((feature: ProductOverviewFeature) => (
                <li key={feature.title} className="product-detail-feature-item">
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    weight="semibold"
                    label={feature.title}
                  />
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                    label={feature.body}
                  />
                </li>
              ))}
            </ul>
          </div>
          {copy.features.length > 3 ? (
            <ModusWcButton
              color="primary"
              variant="borderless"
              size="sm"
              customClass="product-detail-show-more"
              aria-expanded={featuresExpanded}
              onButtonClick={() => setFeaturesExpanded((open) => !open)}
            >
              {featuresExpanded ? 'Show less' : 'Show more'}
            </ModusWcButton>
          ) : null}
        </div>
      ) : null}

      {related.length > 0 ? (
        <section
          className="product-detail-related"
          aria-labelledby="related-items-heading"
        >
          <div className="product-detail-related-header">
            <h2
              id="related-items-heading"
              className="product-detail-related-title"
            >
              Related items
            </h2>
            <div className="product-detail-related-nav">
              <ModusWcButton
                color="tertiary"
                variant="filled"
                shape="square"
                size="sm"
                aria-label="Scroll related items left"
                onButtonClick={() => scrollRail(-1)}
              >
                <ModusWcIcon name="chevron_left" size="sm" decorative />
              </ModusWcButton>
              <ModusWcButton
                color="tertiary"
                variant="filled"
                shape="square"
                size="sm"
                aria-label="Scroll related items right"
                onButtonClick={() => scrollRail(1)}
              >
                <ModusWcIcon name="chevron_right" size="sm" decorative />
              </ModusWcButton>
            </div>
          </div>
          <ul
            ref={railRef}
            className="product-rail product-detail-related-rail m-0 flex list-none gap-4 overflow-x-auto p-0 pb-1"
          >
            {related.map((item) => (
              <li key={item.id} className="product-rail-item min-w-0 shrink-0">
                <ProductCard product={item} onAddToCart={onAddToCart} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
