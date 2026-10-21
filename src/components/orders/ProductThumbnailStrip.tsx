import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { LineItem } from '../../orders/types';

const PREVIEW_COUNT = 4;
const FALLBACK_IMAGE = '/products/gnss-receiver.png';

type ProductThumbnailStripProps = {
  items: LineItem[];
  onShowMore: () => void;
  showQuantityMultipliers?: boolean;
};

/**
 * Compact horizontal preview of up to 4 product thumbs.
 * Excess lines surface as a clickable “+X more items” badge.
 */
export default function ProductThumbnailStrip({
  items,
  onShowMore,
  showQuantityMultipliers = false,
}: ProductThumbnailStripProps) {
  const preview = items.slice(0, PREVIEW_COUNT);
  const moreCount = Math.max(0, items.length - PREVIEW_COUNT);

  if (items.length === 0) {
    return (
      <ModusWcTypography
        hierarchy="p"
        size="xs"
        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
        label="No line items"
      />
    );
  }

  return (
    <div className="product-thumb-strip" aria-label="Product preview">
      <ul className="product-thumb-strip-list">
        {preview.map((item, index) => (
          <li key={`${item.partNumber}-${index}`}>
            <div className="product-thumb-strip-cell">
              {showQuantityMultipliers ? (
                <span className="product-thumb-qty" aria-hidden="true">
                  {item.quantity}x
                </span>
              ) : null}
              <img
                src={item.image || FALLBACK_IMAGE}
                alt=""
                width={40}
                height={40}
                className="product-thumb product-thumb--40"
              />
            </div>
          </li>
        ))}
      </ul>

      {moreCount > 0 ? (
        <ModusWcButton
          variant="borderless"
          color="tertiary"
          size="sm"
          customClass="product-thumb-more-btn"
          aria-label={`View ${moreCount} more items`}
          onButtonClick={onShowMore}
        >
          <ModusWcBadge variant="filled" size="sm">
            {`+${moreCount} more items`}
          </ModusWcBadge>
        </ModusWcButton>
      ) : null}
    </div>
  );
}
