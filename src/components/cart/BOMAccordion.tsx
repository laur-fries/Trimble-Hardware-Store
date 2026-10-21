import { useId, useMemo, useState } from 'react';
import {
  ModusWcBadge,
  ModusWcCollapse,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import {
  isBomComponentSelectable,
  resolveBomComponents,
  type ResolvedBomComponent,
} from '../../cart/bomHelpers';
import type { CatalogProduct, StockStatus } from '../../catalogData';
import { productDetailPathForPn } from '../../catalog/productLookup';
import ProductTitleLink from '../ProductTitleLink';

const stockMeta: Record<
  Exclude<StockStatus, 'out-of-stock'>,
  { color: 'success' | 'warning'; icon: string; label: string }
> = {
  'in-stock': {
    color: 'success',
    icon: 'check_circle',
    label: 'Plenty in stock',
  },
  limited: {
    color: 'warning',
    icon: 'warning',
    label: 'Limited availability',
  },
};

interface BOMAccordionProps {
  product: CatalogProduct;
  /** Parent kit line quantity — BOM counts scale with this. */
  kitQuantity: number;
}

/**
 * Collapsible kit BOM — gray header, white component list inset by 16px.
 */
export default function BOMAccordion({
  product,
  kitQuantity,
}: BOMAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const collapseId = useId();

  const components = useMemo(
    () =>
      resolveBomComponents(product).filter((c) =>
        isBomComponentSelectable(c.stock)
      ),
    [product]
  );

  const scale = Math.max(1, kitQuantity);
  const itemCountLabel = `${components.length} ${
    components.length === 1 ? 'item' : 'items'
  }`;

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
            label="Included kit components"
          />
          <ModusWcBadge
            variant="outlined"
            color="high-contrast"
            size="sm"
            customClass="bom-accordion-count"
          >
            {itemCountLabel}
          </ModusWcBadge>
        </div>

        <div slot="content" className="bom-accordion-body min-w-0">
          <ul
            className="bom-component-list"
            aria-label={`Bill of materials for ${product.name}`}
          >
            {components.map((component) => (
              <li key={component.pn} className="bom-component-list__item">
                <BomComponentRow
                  component={component}
                  quantity={component.defaultQty * scale}
                />
              </li>
            ))}
          </ul>
        </div>
      </ModusWcCollapse>
    </div>
  );
}

function BomComponentRow({
  component,
  quantity,
}: {
  component: ResolvedBomComponent;
  quantity: number;
}) {
  const stock =
    component.stock === 'out-of-stock'
      ? stockMeta['in-stock']
      : stockMeta[component.stock];

  return (
    <div className="bom-component-row flex min-w-0 items-start gap-3 sm:items-center">
      <div className="cart-thumb cart-thumb--sm shrink-0" aria-hidden="true">
        <img src={component.image} alt="" loading="lazy" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="part-number text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={`PN: ${component.pn}`}
        />
        <ProductTitleLink
          to={productDetailPathForPn(component.pn)}
          name={component.name}
          hierarchy="p"
          size="sm"
          weight="semibold"
        />
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="line-clamp-2 text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={component.description}
        />
        <div className="pt-1">
          <ModusWcBadge variant="text" color={stock.color} size="sm">
            <ModusWcIcon name={stock.icon} size="xs" decorative />
            {stock.label}
          </ModusWcBadge>
        </div>
      </div>

      <div className="flex shrink-0 items-baseline gap-1 self-center">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Qty"
        />
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="bold"
          customClass="tabular-nums"
          label={String(quantity)}
        />
      </div>
    </div>
  );
}
