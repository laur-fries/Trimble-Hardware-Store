import { useId } from 'react';
import { Link } from 'react-router-dom';
import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcCollapse,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd } from '../../cart/CartContext';
import { handleDownloadBomCsv } from '../../catalog/bomCsv';
import {
  getUniversalProductBom,
  resolveStandaloneProduct,
  type UniversalBomRow,
} from '../../catalog/productBom';
import { productDetailPath } from '../../catalog/productLookup';
import type { CatalogProduct, StockStatus } from '../../catalogData';

export type ProductDetailBomSectionProps = {
  product: CatalogProduct;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onAddSpare: (product: CatalogProduct) => void;
};

/** PDP `#bom-section` — kit components or standard inbox contents & spares. */
export default function ProductDetailBomSection({
  product,
  expanded,
  onExpandedChange,
  onAddSpare,
}: ProductDetailBomSectionProps) {
  const collapseId = useId();
  const isKit = Boolean(product.isKit);
  const validBom = getUniversalProductBom(product).filter(
    (sub) => sub.pn !== product.partNumber
  );

  const heading = isKit
    ? `Included kit components (${validBom.length} parts)`
    : `Standard inbox contents & spares (${validBom.length} items)`;
  const subtext = isKit
    ? `All ${validBom.length} items below are included in this pre-packaged kit price under parent PN: ${product.partNumber}.`
    : 'Inspect standard inbox parts, factory components, and orderable replacement accessories.';

  return (
    <div className="product-detail-bom">
      <div className="product-detail-bom-header">
        <div className="min-w-0">
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label={heading}
          />
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={subtext}
          />
        </div>
        <ModusWcButton
          color="tertiary"
          variant="outlined"
          size="sm"
          aria-label={`Download bill of materials for PN ${product.partNumber} as CSV`}
          onButtonClick={() => handleDownloadBomCsv(product)}
        >
          <ModusWcIcon name="download" size="xs" decorative />
          Download BOM (CSV)
        </ModusWcButton>
      </div>

      <ModusWcCollapse
        bordered={false}
        collapseId={collapseId}
        expanded={expanded}
        chevronPosition="right"
        customClass="product-detail-bom-collapse"
        onExpandedChange={(e: CustomEvent<{ expanded: boolean }>) =>
          onExpandedChange(e.detail.expanded)
        }
      >
        <div slot="header" className="flex w-full min-w-0 items-center gap-2">
          <ModusWcTypography
            hierarchy="p"
            size="md"
            weight="semibold"
            customClass="min-w-0 flex-1"
            label="Bill of materials"
          />
        </div>

        <div slot="content" className="flex flex-col gap-3 pt-2">
          <ul className="pdp-bom-list" aria-label={heading}>
            {validBom.map((row) => (
              <li key={`${product.id}-${row.pn}`} className="pdp-bom-list__item">
                <BomRow row={row} isKit={isKit} onAddSpare={onAddSpare} />
              </li>
            ))}
          </ul>
        </div>
      </ModusWcCollapse>
    </div>
  );
}

const STOCK_COPY: Record<
  StockStatus,
  { tone: 'success' | 'warning' | 'danger'; icon: string; label: string }
> = {
  'in-stock': { tone: 'success', icon: 'check_circle', label: 'Plenty in stock' },
  limited: { tone: 'warning', icon: 'warning', label: 'Limited availability' },
  'out-of-stock': {
    tone: 'danger',
    icon: 'cancel_circle',
    label: 'Out of stock - Backorder available',
  },
};

/** One BOM line; renders nested sub-assembly components as an indented tree. */
function BomRow({
  row,
  isKit,
  onAddSpare,
  depth = 0,
}: {
  row: UniversalBomRow;
  isKit: boolean;
  onAddSpare: (product: CatalogProduct) => void;
  depth?: number;
}) {
  const children = row.children ?? [];

  return (
    <>
      <BomRowContent
        row={row}
        isKit={isKit}
        onAddSpare={onAddSpare}
        nested={depth > 0}
      />
      {children.length > 0 ? (
        <ul
          className="pdp-bom-children"
          aria-label={`Components of ${row.title}`}
        >
          {children.map((child) => (
            <li key={child.pn} className="pdp-bom-children__item">
              <BomRow
                row={child}
                isKit={isKit}
                onAddSpare={onAddSpare}
                depth={depth + 1}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function BomRowContent({
  row,
  isKit,
  onAddSpare,
  nested,
}: {
  row: UniversalBomRow;
  isKit: boolean;
  onAddSpare: (product: CatalogProduct) => void;
  nested: boolean;
}) {
  const standalone = row.isOrderable ? resolveStandaloneProduct(row) : undefined;
  const standaloneHref = standalone ? productDetailPath(standalone) : undefined;
  const standalonePrice = row.standalonePrice;
  const stock = STOCK_COPY[row.stock];

  return (
    <div className={nested ? 'pdp-bom-row pdp-bom-row--nested' : 'pdp-bom-row'}>
      <img
        src={row.imageUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pdp-bom-row-thumb"
      />

      <div className="pdp-bom-row-main">
        <div className="pdp-bom-row-identity">
          <span className="pdp-bom-row-pn">PN: {row.pn}</span>
          {standaloneHref ? (
            <Link
              to={standaloneHref}
              target="_blank"
              rel="noopener noreferrer"
              className="pdp-bom-row-link"
              aria-label={`${row.title} (opens in a new tab)`}
            >
              {row.title}
              <ModusWcIcon name="launch" size="xs" decorative />
            </Link>
          ) : (
            <span className="pdp-bom-row-title">{row.title}</span>
          )}
          {!standalone ? (
            <ModusWcBadge
              variant="outlined"
              color="tertiary"
              size="sm"
              customClass="pdp-bom-row-badge"
            >
              Not sold separately
            </ModusWcBadge>
          ) : null}
        </div>

        {row.description ? (
          <p className="pdp-bom-row-description">{row.description}</p>
        ) : null}

        {standalone ? (
          <p
            className={`pdp-bom-row-stock pdp-bom-row-stock--${stock.tone}`}
          >
            <ModusWcIcon name={stock.icon} size="xs" decorative />
            {stock.label}
          </p>
        ) : null}
      </div>

      <div className="pdp-bom-row-actions">
        {isKit && standaloneHref ? (
          <Link
            to={standaloneHref}
            target="_blank"
            rel="noopener noreferrer"
            className="pdp-bom-row-link pdp-bom-row-link--secondary"
            aria-label={`View standalone SKU ${row.standalonePn ?? row.pn} (opens in a new tab)`}
          >
            {standalonePrice != null
              ? `View standalone SKU (${formatUsd(standalonePrice)} Net)`
              : 'View standalone SKU'}
            <ModusWcIcon name="launch" size="xs" decorative />
          </Link>
        ) : null}
        {!isKit && standalone ? (
          <ModusWcButton
            color="tertiary"
            variant="outlined"
            size="sm"
            aria-label={`Add 1 extra spare ${row.title} to cart`}
            onButtonClick={() => onAddSpare(standalone)}
          >
            <ModusWcIcon name="add" size="xs" decorative />
            {standalonePrice != null
              ? `Add extra spare (${formatUsd(standalonePrice)})`
              : 'Add extra spare'}
          </ModusWcButton>
        ) : null}
        <span className="pdp-bom-row-qty">Qty: {row.qtyPerPackage}</span>
      </div>
    </div>
  );
}
