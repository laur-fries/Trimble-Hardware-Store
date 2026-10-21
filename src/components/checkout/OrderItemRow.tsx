import { useId, useState } from 'react';
import {
  ModusWcBadge,
  ModusWcCollapse,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd } from '../../cart/CartContext';
import KitStockRollupBadge from '../cart/KitStockRollupBadge';
import {
  kitComponentStockMeta,
  type KitComponent,
  type OrderLineItem,
} from '../../types/order';

export type OrderItemRowVariant = 'summary' | 'detailed';

export interface OrderItemRowProps {
  item: OrderLineItem;
  /** `summary` — compact checkout card rows; `detailed` — thumbnail + full parent row. */
  variant?: OrderItemRowVariant;
}

/**
 * Checkout order line — standard SKU or expandable kit BOM parent.
 */
export default function OrderItemRow({
  item,
  variant = 'summary',
}: OrderItemRowProps) {
  const isDetailed = variant === 'detailed';

  return (
    <li
      className={
        item.isKit
          ? 'order-item-row order-item-row--kit'
          : 'order-item-row order-item-row--standard'
      }
      role="row"
    >
      {isDetailed ? (
        <DetailedParentRow item={item} />
      ) : (
        <SummaryParentRow item={item} />
      )}

      {item.isKit && item.kitComponents?.length ? (
        <OrderKitBomPanel
          parentQuantity={item.quantity}
          components={item.kitComponents}
        />
      ) : null}
    </li>
  );
}

function SummaryParentRow({ item }: { item: OrderLineItem }) {
  return (
    <div className="order-item-row-parent order-item-row-parent--summary">
      <div
        className="order-item-row-qty"
        role="cell"
        aria-label={`Quantity ${item.quantity}`}
      >
        <ModusWcBadge variant="filled" color="primary" size="sm">
          {`${item.quantity}x`}
        </ModusWcBadge>
      </div>

      <div className="order-item-row-pn flex flex-wrap items-center gap-2" role="cell">
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="part-number"
          label={`PN: ${item.pn}`}
        />
        <BundledKitBadge item={item} />
      </div>

      <div className="order-item-row-title" role="cell">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="order-item-row-title-text"
          label={item.title}
        />
        <KitRollup item={item} />
      </div>

      <OrderItemPricing item={item} align="summary" />
    </div>
  );
}

function DetailedParentRow({ item }: { item: OrderLineItem }) {
  return (
    <div className="order-item-row-parent order-item-row-parent--detailed">
      <div className="cart-thumb shrink-0" aria-hidden="true">
        <img src={item.imageUrl ?? '/products/gnss-receiver.png'} alt="" loading="lazy" />
      </div>

      <div className="order-item-row-copy min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="part-number text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={`PN: ${item.pn}`}
          />
          <BundledKitBadge item={item} />
        </div>
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="semibold"
          label={item.title}
        />
        <KitRollup item={item} />
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={`Qty: ${item.quantity}`}
        />
      </div>

      <OrderItemPricing item={item} align="detailed" />
    </div>
  );
}

function BundledKitBadge({ item }: { item: OrderLineItem }) {
  if (!item.isKit) return null;
  return (
    <ModusWcBadge variant="filled" color="tertiary" size="sm">
      BUNDLED KIT
    </ModusWcBadge>
  );
}

function KitRollup({ item }: { item: OrderLineItem }) {
  if (!item.isKit || !item.kitStockRollup) return null;
  return (
    <div className="pt-1">
      <KitStockRollupBadge status={item.kitStockRollup} />
    </div>
  );
}

function OrderItemPricing({
  item,
  align,
}: {
  item: OrderLineItem;
  align: 'summary' | 'detailed';
}) {
  const total = formatUsd(item.totalPrice);
  const each =
    item.quantity > 1 ? formatUsd(item.unitPrice) : null;

  return (
    <div
      className={
        align === 'summary'
          ? 'order-item-row-pricing order-item-row-pricing--summary'
          : 'order-item-row-pricing order-item-row-pricing--detailed'
      }
      role="cell"
      aria-label={`Line total ${total}${each ? `, ${each} each` : ''}`}
    >
      <ModusWcTypography
        hierarchy="p"
        size="sm"
        weight="semibold"
        customClass="tabular-nums"
        label={total}
      />
      {each ? (
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="tabular-nums text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={`${each} each`}
        />
      ) : null}
    </div>
  );
}

function OrderKitBomPanel({
  parentQuantity,
  components,
}: {
  parentQuantity: number;
  components: KitComponent[];
}) {
  const [expanded, setExpanded] = useState(false);
  const collapseId = useId();
  const partCount = components.length;
  const scale = Math.max(1, parentQuantity);

  return (
    <div className="order-kit-bom-panel">
      <ModusWcCollapse
        bordered={false}
        collapseId={collapseId}
        expanded={expanded}
        chevronPosition="right"
        customClass="order-kit-bom-collapse"
        onExpandedChange={(e: CustomEvent<{ expanded: boolean }>) => {
          setExpanded(e.detail.expanded);
        }}
      >
        <div
          slot="header"
          className="order-kit-bom-trigger flex w-full min-w-0 items-center gap-2"
        >
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            customClass="min-w-0 flex-1"
            label={`Included kit components (${partCount} ${partCount === 1 ? 'part' : 'parts'})`}
          />
        </div>

        <div slot="content" className="order-kit-bom-body">
          <ul
            className="order-kit-bom-list"
            aria-label="Included kit components"
          >
            {components.map((component) => (
              <li key={component.id} className="order-kit-bom-list__item">
                <KitComponentRow
                  component={component}
                  quantity={component.qtyPerKit * scale}
                />
              </li>
            ))}
          </ul>
        </div>
      </ModusWcCollapse>
    </div>
  );
}

function KitComponentRow({
  component,
  quantity,
}: {
  component: KitComponent;
  quantity: number;
}) {
  const stock = kitComponentStockMeta[component.inStockStatus];

  return (
    <div className="order-kit-bom-component flex min-w-0 items-start gap-3 sm:items-center">
      <div
        className="order-kit-bom-thumb shrink-0"
        aria-hidden="true"
      >
        <img
          src={component.imageUrl ?? '/products/gnss-receiver.png'}
          alt=""
          loading="lazy"
        />
      </div>

      <div className="order-kit-bom-component-copy min-w-0 flex-1">
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          weight="bold"
          customClass="part-number"
          label={`PN: ${component.pn}`}
        />
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="semibold"
          label={component.title}
        />
        <div className="pt-1">
          <ModusWcBadge variant="text" color={stock.color} size="sm">
            <ModusWcIcon name={stock.icon} size="xs" decorative />
            {stock.label}
          </ModusWcBadge>
        </div>
      </div>

      <div className="order-kit-bom-component-meta flex shrink-0 flex-col items-end gap-1 self-center">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="bold"
          customClass="tabular-nums"
          label={`Qty ${quantity}`}
        />
        <ModusWcBadge variant="outlined" color="high-contrast" size="sm">
          Included
        </ModusWcBadge>
      </div>
    </div>
  );
}
