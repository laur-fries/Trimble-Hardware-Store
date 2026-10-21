import { useMemo, useState } from 'react';
import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTable,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { ITableColumn } from '@trimble-oss/moduswebcomponents';
import { formatUsd } from '../../cart/CartContext';
import type { ConfirmationShipment } from '../../checkout/confirmation';
import { DELIVERY_PENDING_SHIPPING_REVIEW } from '../../checkout/confirmationDeliveryCopy';
import { downloadPackoutCsv } from '../../checkout/packoutCsv';

/** Rows shown before "View all" so long manifests stay scannable. */
export const INITIAL_VISIBLE_ITEMS = 4;

type ManifestRow = {
  id: string;
  partNumber: string;
  title: string;
  image: string;
  isKit: boolean;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function itemCell(_value: unknown, row: unknown): HTMLElement {
  const item = row as ManifestRow;
  const wrap = document.createElement('div');
  wrap.className = 'manifest-item';

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = '';
  img.loading = 'lazy';
  img.className = 'manifest-item-thumb';

  const text = document.createElement('div');
  text.className = 'manifest-item-text';

  const pn = document.createElement('span');
  pn.className = 'part-number manifest-item-pn';
  pn.textContent = `PN: ${item.partNumber}`;

  const title = document.createElement('span');
  title.className = 'manifest-item-title';
  title.textContent = item.title;

  text.append(pn, title);

  if (item.isKit) {
    const badge = document.createElement('modus-wc-badge');
    badge.setAttribute('variant', 'filled');
    badge.setAttribute('color', 'primary');
    badge.setAttribute('size', 'sm');
    badge.setAttribute('custom-class', 'kit-badge-dark');
    badge.textContent = 'KIT';
    text.append(badge);
  }

  wrap.append(img, text);
  return wrap;
}

function moneyCell(value: unknown): string {
  return formatUsd(typeof value === 'number' ? value : 0);
}

// Stable column definitions so the table does not re-initialize each render.
const COLUMNS: ITableColumn[] = [
  { id: 'item', header: 'Item', accessor: 'title', cellRenderer: itemCell },
  {
    id: 'quantity',
    header: 'Qty',
    accessor: 'quantity',
    width: '4.5rem',
    className: 'manifest-num',
  },
  {
    id: 'unitPrice',
    header: 'Unit net',
    accessor: 'unitPrice',
    width: '7.5rem',
    className: 'manifest-num',
    cellRenderer: moneyCell,
  },
  {
    id: 'lineTotal',
    header: 'Line total',
    accessor: 'lineTotal',
    width: '8rem',
    className: 'manifest-num manifest-num--strong',
    cellRenderer: moneyCell,
  },
];

export type ShipmentGroupProps = {
  shipment: ConfirmationShipment;
  index: number;
  totalShipments: number;
  salesOrderNumber: string;
};

/** Dense, exportable manifest for one destination of a confirmed order. */
export default function ShipmentGroup({
  shipment,
  index,
  totalShipments,
  salesOrderNumber,
}: ShipmentGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = shipment.items.length;
  const hiddenCount = Math.max(0, itemCount - INITIAL_VISIBLE_ITEMS);
  const pendingReview =
    shipment.estimatedDelivery === DELIVERY_PENDING_SHIPPING_REVIEW;

  const rows = useMemo<ManifestRow[]>(
    () =>
      shipment.items.map((item) => ({
        id: `${shipment.addressId}-${item.productId}`,
        partNumber: item.partNumber,
        title: item.title,
        image: item.image,
        isKit: Boolean(item.isKit),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
      })),
    [shipment]
  );
  const visibleRows = useMemo(
    () => (expanded ? rows : rows.slice(0, INITIAL_VISIBLE_ITEMS)),
    [rows, expanded]
  );

  const heading =
    totalShipments > 1
      ? `Shipment ${index + 1} of ${totalShipments}: ${shipment.addressLabel}`
      : `Shipment: ${shipment.addressLabel}`;

  return (
    <section aria-label={heading}>
      <ModusWcCard bordered={true} padding="compact">
        <div className="shipment-group-header">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ModusWcTypography
                hierarchy="h3"
                size="md"
                weight="semibold"
                label={heading}
              />
              <ModusWcBadge variant="filled" color="tertiary" size="sm">
                {`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              </ModusWcBadge>
            </div>
            {shipment.address ? (
              <ModusWcTypography
                hierarchy="p"
                size="xs"
                customClass="shipment-group-muted"
                label={shipment.address}
              />
            ) : null}
            <ModusWcTypography
              hierarchy="p"
              size="xs"
              weight="semibold"
              customClass={
                pendingReview
                  ? 'order-confirmation-delivery-pending'
                  : 'shipment-group-eta'
              }
              label={shipment.estimatedDelivery}
            />
          </div>
          <ModusWcButton
            color="tertiary"
            variant="outlined"
            size="sm"
            customClass="shipment-group-export"
            aria-label={`Export pack-out list for ${shipment.addressLabel} as CSV`}
            onButtonClick={() => downloadPackoutCsv(shipment, salesOrderNumber)}
          >
            <ModusWcIcon name="download" size="xs" decorative />
            Export pack-out list (CSV)
          </ModusWcButton>
        </div>

        <div className="shipment-group-table min-w-0">
          <ModusWcTable
            columns={COLUMNS}
            data={visibleRows}
            density="compact"
            hover
            zebra
            sortable={false}
            caption={`Items shipping to ${shipment.addressLabel}`}
          />
        </div>

        {hiddenCount > 0 ? (
          <div className="shipment-group-toggle">
            <ModusWcButton
              color="tertiary"
              variant="borderless"
              size="sm"
              fullWidth
              aria-expanded={expanded}
              onButtonClick={() => setExpanded((open) => !open)}
            >
              <ModusWcIcon
                name={expanded ? 'expand_less' : 'expand_more'}
                size="xs"
                decorative
              />
              {expanded
                ? 'Show fewer items'
                : `View all ${itemCount} items in ${shipment.addressLabel} (${hiddenCount} more)`}
            </ModusWcButton>
          </div>
        ) : null}
      </ModusWcCard>
    </section>
  );
}
