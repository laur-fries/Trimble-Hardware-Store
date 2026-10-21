import { useId, useState } from 'react';
import {
  ModusWcBadge,
  ModusWcCollapse,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { UniversalBomRow } from '../../catalog/productBom';
import type { CatalogProduct } from '../../catalogData';
import CartBomRow from './CartBomRow';

interface CartLineBomAccordionProps {
  product: CatalogProduct;
  isKit: boolean;
  /** BOM rows with the parent PN already filtered out. */
  bomItems: UniversalBomRow[];
}

/**
 * Cart line BOM accordion — read-only list of kit components or inbox contents.
 */
export default function CartLineBomAccordion({
  product,
  isKit,
  bomItems,
}: CartLineBomAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const collapseId = useId();

  const headerLabel = isKit ? 'Kit components' : 'Included parts';
  const countLabel = `${bomItems.length} ${isKit ? 'parts' : 'items'}`;

  return (
    <div className="bom-accordion mt-2 min-w-0">
      <ModusWcCollapse
        bordered={false}
        collapseId={collapseId}
        expanded={expanded}
        chevronPosition="right"
        customClass="bom-accordion-collapse"
        onExpandedChange={(e: CustomEvent<{ expanded: boolean }>) =>
          setExpanded(e.detail.expanded)
        }
      >
        <div
          slot="header"
          className="bom-accordion-header flex w-full min-w-0 items-center gap-2"
        >
          <ModusWcTypography
            hierarchy="p"
            size="md"
            weight="semibold"
            customClass="min-w-0 flex-1"
            label={headerLabel}
          />
          <ModusWcBadge
            variant="filled"
            color="primary"
            size="sm"
            customClass="kit-badge-dark bom-accordion-count-pill"
            aria-label={countLabel}
          >
            {String(bomItems.length)}
          </ModusWcBadge>
        </div>

        <div slot="content" className="bom-accordion-body min-w-0">
          <ul
            className="bom-component-list"
            aria-label={`${headerLabel} for ${product.name}`}
          >
            {bomItems.map((row) => (
              <li
                key={`${product.id}-${row.pn}`}
                className="bom-component-list__item"
              >
                <CartBomRow row={row} />
              </li>
            ))}
          </ul>
        </div>
      </ModusWcCollapse>
    </div>
  );
}
