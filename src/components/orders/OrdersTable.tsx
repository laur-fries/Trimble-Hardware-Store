import { useEffect, useMemo, useRef, useState } from 'react';
import { ModusWcTable } from '@trimble-oss/moduswebcomponents-react';
import type { ITableColumn } from '@trimble-oss/moduswebcomponents';
import { formatUsd } from '../../cart/CartContext';
import {
  downloadableDocumentKind,
  invoiceDownloadLabel,
  invoiceStatePresentation,
  logisticsStatusTone,
} from '../../orders/orderRows';
import type { InvoiceDocumentKind, OrderRowData } from '../../types/order';

export type OrdersTableProps = {
  orders: OrderRowData[];
  onViewDetails: (soNumber: string) => void;
  onDownloadDocument: (soNumber: string, kind: InvoiceDocumentKind) => void;
  onReorder: (soNumber: string) => void;
  onReportIssue: (soNumber: string) => void;
  onPackout?: (soNumber: string) => void;
};

type Handlers = Omit<OrdersTableProps, 'orders'>;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function modus(tag: string, attrs: Record<string, string>): HTMLElement {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function icon(name: string, size = 'xs', variant?: string): HTMLElement {
  const node = modus('modus-wc-icon', { name, size, decorative: '' });
  if (variant) node.setAttribute('variant', variant);
  return node;
}

function badge(label: string, color: string, iconName?: string): HTMLElement {
  const node = modus('modus-wc-badge', {
    variant: 'filled',
    color,
    size: 'sm',
    'custom-class': 'orders-table-badge',
  });
  if (iconName) node.append(icon(iconName, 'xs', 'solid'));
  node.append(label);
  return node;
}

function twoLine(primary: string | Node, secondary: string, primaryClass = ''): HTMLElement {
  const wrap = el('div', 'orders-table-cell');
  const top = el('div', `orders-table-primary ${primaryClass}`.trim());
  top.append(primary);
  wrap.append(top, el('div', 'orders-table-secondary', secondary));
  return wrap;
}

function formatPlacedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

const PACKOUT_STATUSES = new Set(['Shipped', 'In transit']);

/** PRD invoice status badge, or "Pending shipment" when the order has not been invoiced yet. */
function renderInvoiceStatus(order: OrderRowData): HTMLElement {
  if (!order.invoiceStatus) {
    const pending = modus('modus-wc-badge', {
      variant: 'outlined',
      color: 'primary',
      size: 'sm',
      'custom-class': 'orders-table-badge',
    });
    pending.title =
      'Official tax invoice is generated upon warehouse shipment. Download the proforma for internal PO reconciliation.';
    pending.append(icon('hourglass', 'xs', 'solid'), 'Pending shipment');
    return pending;
  }

  const tone = invoiceStatePresentation({ ...order, invoiceStatus: order.invoiceStatus });
  const node = modus('modus-wc-badge', {
    variant: tone.variant,
    color: tone.color,
    size: 'sm',
    'custom-class':
      order.invoiceStatus === 'Cancelled'
        ? 'orders-table-badge orders-table-badge--void'
        : 'orders-table-badge',
  });
  node.title = tone.description;
  node.append(icon(tone.icon, 'xs', 'solid'), tone.label);
  return node;
}

/** Keeps in-row controls from also triggering the row's open-details click. */
function stopRowClick(event: Event): void {
  event.stopPropagation();
}

function buildColumns(handlers: React.RefObject<Handlers>): ITableColumn[] {
  const call = <K extends keyof Handlers>(key: K) =>
    handlers.current[key] as NonNullable<Handlers[K]>;

  return [
    {
      id: 'order',
      header: 'Order / PO number',
      accessor: 'salesOrderNumber',
      sortable: false,
      cellRenderer: (_v, row) => {
        const order = row as OrderRowData;
        return twoLine(
          order.salesOrderNumber,
          `PO: ${order.dealerPoNumber}`,
          'part-number'
        );
      },
    },
    {
      id: 'placed',
      header: 'Placed',
      accessor: 'placedDate',
      width: '9.5rem',
      cellRenderer: (_v, row) => {
        const order = row as OrderRowData;
        const cell = twoLine(formatPlacedDate(order.placedDate), order.placedBy);
        cell.title = order.placedBy;
        return cell;
      },
    },
    {
      id: 'fulfillment',
      header: 'Fulfillment',
      accessor: 'totalItemCount',
      sortable: false,
      cellRenderer: (_v, row) => {
        const order = row as OrderRowData;
        const top = el('span', 'orders-table-inline');
        top.append(
          el(
            'span',
            undefined,
            `${order.totalItemCount} ${order.totalItemCount === 1 ? 'item' : 'items'}`
          )
        );
        if (order.logisticsStatus !== 'Cancelled') {
          top.append(
            el('span', 'orders-table-sep', '·'),
            el(
              'span',
              order.shipmentCount > 1
                ? 'orders-table-shipments orders-table-shipments--multi'
                : 'orders-table-shipments',
              `${order.shipmentCount} ${order.shipmentCount === 1 ? 'shipment' : 'shipments'}`
            )
          );
        }

        const route = el('div', 'orders-table-secondary');
        route.title = order.carrierSummary
          ? `${order.warehouseSummary} (${order.carrierSummary})`
          : order.warehouseSummary;
        route.append(order.warehouseSummary);
        if (order.carrierSummary) {
          route.append(' ', el('span', 'orders-table-carrier', `(${order.carrierSummary})`));
        }

        const wrap = el('div', 'orders-table-cell');
        const primary = el('div', 'orders-table-primary');
        primary.append(top);
        wrap.append(primary, route);
        return wrap;
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'logisticsStatus',
      width: '9.5rem',
      cellRenderer: (_v, row) => {
        const order = row as OrderRowData;
        const tone = logisticsStatusTone(order);
        const status = badge(order.logisticsStatus, tone.color, tone.icon);
        if (!order.holdReason) return status;
        const cell = el('div', 'orders-table-cell');
        cell.append(status, el('div', 'orders-table-secondary', order.holdReason));
        return cell;
      },
    },
    {
      id: 'netTotal',
      header: 'Net total',
      accessor: 'netTotal',
      width: '8.5rem',
      className: 'orders-table-num',
      cellRenderer: (_v, row) => {
        const order = row as OrderRowData;
        return twoLine(formatUsd(order.netTotal), order.paymentTerms, 'tabular-nums');
      },
    },
    {
      id: 'invoice',
      header: 'Invoice',
      accessor: 'invoiceStatus',
      width: '11rem',
      sortable: false,
      className: 'orders-table-invoice-col',
      cellRenderer: (_v, row) => renderInvoiceStatus(row as OrderRowData),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: 'salesOrderNumber',
      width: '11rem',
      sortable: false,
      className: 'orders-table-actions-col',
      cellRenderer: (_v, row) => {
        const order = row as OrderRowData;
        const so = order.salesOrderNumber;
        const wrap = el('div', 'orders-table-actions');
        wrap.addEventListener('click', stopRowClick);

        const view = modus('modus-wc-button', {
          color: 'tertiary',
          variant: 'outlined',
          size: 'sm',
          'custom-class': 'orders-table-btn',
          'aria-label': `View details for ${so}`,
        });
        view.append('View details', icon('arrow_right'));
        view.addEventListener('buttonClick', () => call('onViewDetails')(so));

        const menu = modus('modus-wc-dropdown-menu', {
          'button-aria-label': `More actions for ${so}`,
          'button-variant': 'borderless',
          'button-color': 'tertiary',
          'button-size': 'sm',
          'button-shape': 'square',
          'menu-placement': 'bottom-end',
          'menu-strategy': 'fixed',
          'menu-size': 'sm',
        });
        const trigger = el('div');
        trigger.slot = 'button';
        trigger.append(icon('more_vertical', 'sm'));
        const items = el('div');
        items.slot = 'menu';

        const actions: [string, string, string, () => void][] = [];
        const documentKind = downloadableDocumentKind(order);
        if (documentKind) {
          actions.push([
            'document',
            invoiceDownloadLabel(documentKind),
            'file_type_pdf',
            () => call('onDownloadDocument')(so, documentKind),
          ]);
        }
        actions.push(['reorder', 'Reorder all items', 'refresh', () => call('onReorder')(so)]);
        if (handlers.current.onPackout && PACKOUT_STATUSES.has(order.logisticsStatus)) {
          actions.push([
            'packout',
            'Download pack-out list',
            'clipboard',
            () => handlers.current.onPackout?.(so),
          ]);
        }
        actions.push([
          'issue',
          'Report transaction issue',
          'chat',
          () => call('onReportIssue')(so),
        ]);
        for (const [value, label, iconName, run] of actions) {
          const item = modus('modus-wc-menu-item', { label, value });
          const glyph = icon(iconName, 'sm');
          glyph.slot = 'start-icon';
          item.append(glyph);
          item.addEventListener('itemSelect', () => {
            (menu as HTMLElement & { menuVisible: boolean }).menuVisible = false;
            run();
          });
          items.append(item);
        }
        menu.append(trigger, items);

        wrap.append(view, menu);
        return wrap;
      },
    },
  ];
}

/**
 * Dense placed-orders table: every order renders as one fixed-height row
 * regardless of line or shipment count. Full manifests live in the detail drawer.
 */
export default function OrdersTable({ orders, ...handlers }: OrdersTableProps) {
  const handlersRef = useRef<Handlers>(handlers);
  handlersRef.current = handlers;

  const columns = useMemo(() => buildColumns(handlersRef), []);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [orders]);

  return (
    <div className="orders-table min-w-0">
      <ModusWcTable
        columns={columns}
        data={orders as unknown as Record<string, unknown>[]}
        density="compact"
        hover
        zebra
        sortable
        paginated={orders.length > PAGE_SIZE_OPTIONS[0]}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        showPageSizeSelector
        currentPage={page}
        caption="Placed orders"
        onPaginationChange={(e: CustomEvent<{ currentPage: number }>) =>
          setPage(e.detail.currentPage)
        }
        onRowClick={(e: CustomEvent<{ row: Record<string, unknown> }>) => {
          const so = (e.detail.row as unknown as OrderRowData).salesOrderNumber;
          // The drawer closes on outside clicks; open it after this click finishes bubbling.
          window.setTimeout(() => handlersRef.current.onViewDetails(so), 0);
        }}
      />
    </div>
  );
}
