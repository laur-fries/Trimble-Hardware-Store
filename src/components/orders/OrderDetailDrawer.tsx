import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ModusWcAlert,
  ModusWcBadge,
  ModusWcButton,
  ModusWcCollapse,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcTextInput,
  ModusWcTypography,
  ModusWcUtilityPanel,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, type CartLine } from '../../cart/CartContext';
import {
  getLineTotal,
  getLineUnitPrice,
  isBomComponentSelectable,
  resolveBomComponents,
} from '../../cart/bomHelpers';
import type { DaRequest } from '../../da/types';
import { mapPlacedOrderToOrder } from '../../orders/mapPlacedOrderToOrder';
import {
  DELIVERY_PENDING_SHIPPING_REVIEW,
  formatOrderDeliveryLine,
  orderDeliveryLines,
} from '../../orders/orderDeliveryPresentation';
import {
  carrierTrackingUrl,
  downloadableDocumentKind,
  invoiceDownloadLabel,
  toOrderRowData,
  trackedShipments,
} from '../../orders/orderRows';
import { isShippingReviewHold } from '../../orders/orderStatusDisplay';
import {
  formatShipmentHeader,
  resolveOrderShipments,
} from '../../orders/shipments';
import type {
  LineItem,
  OrderShipment,
  PendingDiscountRequest,
  PlacedOrder,
} from '../../orders/types';
import type { InvoiceDocumentKind, OrderLineItemRow } from '../../types/order';
import SpecialShippingReviewPanel from './SpecialShippingReviewPanel';
import { readInputString } from '../../utils/modusFormEvents';

type UtilityPanelEl = HTMLElement & { targetElement: HTMLElement | null };

export type OrderDetailSubject =
  | { kind: 'placed'; order: PlacedOrder }
  | {
      kind: 'pending';
      request: PendingDiscountRequest;
      da?: DaRequest | null;
    }
  | {
      kind: 'checkout-lines';
      lines: CartLine[];
      title?: string;
      frozen?: boolean;
      approvedDaId?: string;
    };

type OrderDetailDrawerProps = {
  open: boolean;
  subject: OrderDetailSubject | null;
  onClose: () => void;
  onDownloadDocument?: (soNumber: string, kind: InvoiceDocumentKind) => void;
  onSimulate?: (
    id: string,
    status: 'APPROVED' | 'DENIED' | 'COUNTER_OFFERED'
  ) => void;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function pendingStatusBadge(status: PendingDiscountRequest['status']): {
  color: 'warning' | 'success' | 'danger';
  label: string;
} {
  switch (status) {
    case 'UNDER_REVIEW':
      return { color: 'warning', label: 'Under Review' };
    case 'APPROVED':
      return { color: 'success', label: 'Approved' };
    case 'REJECTED':
      return { color: 'danger', label: 'Rejected' };
  }
}

function ShipmentGroup({
  shipment,
  index,
  total,
  lineNumberOffset,
}: {
  shipment: OrderShipment;
  index: number;
  total: number;
  lineNumberOffset: number;
}) {
  return (
    <section
      className="order-shipment-group"
      aria-label={formatShipmentHeader(shipment, index, total)}
    >
      <div className="flex items-start gap-2">
        <ModusWcIcon name="package" size="sm" decorative />
        <ModusWcTypography
          hierarchy="h3"
          size="sm"
          weight="semibold"
          label={formatShipmentHeader(shipment, index, total)}
        />
      </div>

      <ModusWcTypography
        hierarchy="p"
        size="sm"
        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
        label={
          shipment.statusDetail
            ? `${shipment.statusDetail} (${shipment.carrier})`
            : shipment.carrier
        }
      />

      <div className="flex flex-col gap-0.5">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="semibold"
          label={`Ship To: ${shipment.shipTo.label}`}
        />
        {shipment.shipTo.lines.map((line) => (
          <ModusWcTypography
            key={`${shipment.id}-addr-${line}`}
            hierarchy="p"
            size="xs"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={line}
          />
        ))}
      </div>

      <ul
        className="order-shipment-items"
        aria-label={`Shipment ${index + 1} contents`}
      >
        {shipment.items.map((item, itemIndex) => {
          const lineNo = lineNumberOffset + itemIndex + 1;
          const noteSuffix = item.note ? ` [${item.note}]` : '';
          return (
            <li key={`${shipment.id}-${item.partNumber}-${itemIndex}`}>
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label={`Line ${lineNo}: ${item.title} (Qty: ${item.quantity})${noteSuffix}`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PlacedOrderLineRow({
  item,
  lineNumber,
}: {
  item: OrderLineItemRow;
  lineNumber: number;
}) {
  const [bomOpen, setBomOpen] = useState(false);
  const hasBom = Boolean(item.kitComponents?.length);

  return (
    <li className="order-line-row">
      <div className="order-line-row-main">
        <img
          src={item.imageUrl || '/products/gnss-receiver.png'}
          alt=""
          width={48}
          height={48}
          className="product-thumb"
        />
        <div className="min-w-0 flex-1">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label={item.title}
          />
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="font-mono text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={`Line ${lineNumber} · PN ${item.pn} · Qty ${item.qty}`}
          />
        </div>
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="semibold"
          customClass="tabular-nums"
          label={formatUsd(item.unitPrice * item.qty)}
        />
      </div>

      {hasBom ? (
        <ModusWcCollapse
          bordered
          expanded={bomOpen}
          collapseId={`placed-kit-${item.pn}-${lineNumber}`}
          options={{
            title: `Kit BOM (${item.kitComponents!.length} components)`,
            size: 'sm',
            icon: 'list_bulleted',
            iconAriaLabel: 'Bill of materials',
          }}
          onExpandedChange={(e: CustomEvent<{ expanded: boolean }>) => {
            setBomOpen(e.detail.expanded);
          }}
        >
          <div slot="content" className="flex flex-col gap-2 py-1">
            {item.kitComponents!.map((bom) => (
              <div
                key={`${item.pn}-${bom.pn}`}
                className="flex items-center justify-between gap-2"
              >
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  weight="semibold"
                  label={`${bom.title} · PN ${bom.pn}`}
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="tabular-nums text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={`Qty ${bom.qtyPerKit * item.qty}`}
                />
              </div>
            ))}
          </div>
        </ModusWcCollapse>
      ) : null}
    </li>
  );
}

function PendingLineRow({
  item,
  lineNumber,
}: {
  item: LineItem;
  lineNumber: number;
}) {
  return (
    <li className="order-line-row">
      <div className="order-line-row-main">
        <img
          src={item.image || '/products/gnss-receiver.png'}
          alt=""
          width={48}
          height={48}
          className="product-thumb"
        />
        <div className="min-w-0 flex-1">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label={`Line ${lineNumber}: ${item.title}`}
          />
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="font-mono text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={`PN ${item.partNumber} · Qty ${item.quantity}`}
          />
        </div>
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="semibold"
          customClass="tabular-nums"
          label={formatUsd(item.unitPrice * item.quantity)}
        />
      </div>
    </li>
  );
}

function CheckoutLineRow({ line }: { line: CartLine }) {
  const [bomOpen, setBomOpen] = useState(false);
  const unitPrice = getLineUnitPrice(line);
  const lineTotal = getLineTotal(line);
  const components = useMemo(
    () => resolveBomComponents(line.product),
    [line.product]
  );
  const selectedBom = useMemo(() => {
    return components.filter((c) => {
      if (!isBomComponentSelectable(c.stock)) return false;
      const sel = line.bomSelection?.[c.pn];
      return sel ? sel.selected : true;
    });
  }, [components, line.bomSelection]);
  const hasBom = selectedBom.length > 0;

  return (
    <li className="order-line-row">
      <div className="order-line-row-main">
        <div className="min-w-0 flex-1">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label={line.product.name}
          />
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="font-mono text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={`PN ${line.product.partNumber}`}
          />
        </div>
        <div className="order-line-row-meta">
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={`Qty ${line.quantity}`}
          />
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            customClass="tabular-nums"
            label={formatUsd(unitPrice)}
          />
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            customClass="tabular-nums"
            label={formatUsd(lineTotal)}
          />
        </div>
      </div>

      {hasBom ? (
        <ModusWcCollapse
          bordered
          expanded={bomOpen}
          collapseId={`checkout-kit-${line.product.id}`}
          options={{
            title: `Kit BOM (${selectedBom.length} components)`,
            size: 'sm',
            icon: 'list_bulleted',
            iconAriaLabel: 'Bill of materials',
          }}
          onExpandedChange={(e: CustomEvent<{ expanded: boolean }>) => {
            setBomOpen(e.detail.expanded);
          }}
        >
          <div slot="content" className="flex flex-col gap-2 py-1">
            {selectedBom.map((bom) => (
              <div
                key={`${line.product.id}-${bom.pn}`}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    weight="semibold"
                    label={bom.name}
                  />
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    customClass="font-mono text-[var(--modus-wc-color-base-content-low-contrast)]"
                    label={`PN ${bom.pn} · Qty ${bom.defaultQty * line.quantity}`}
                  />
                </div>
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="tabular-nums text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={formatUsd(bom.unitPrice)}
                />
              </div>
            ))}
          </div>
        </ModusWcCollapse>
      ) : null}
    </li>
  );
}

/**
 * Right-side detail drawer for placed orders (shipment groups), pending DAs,
 * and checkout line-item review (searchable table + kit BOM).
 */
export default function OrderDetailDrawer({
  open,
  subject,
  onClose,
  onDownloadDocument,
  onSimulate,
}: OrderDetailDrawerProps) {
  const panelRef = useRef<UtilityPanelEl | null>(null);
  const [query, setQuery] = useState('');
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setAuditOpen(false);
    }
  }, [open, subject]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const placedShipments = useMemo(() => {
    if (subject?.kind !== 'placed') return [];
    return resolveOrderShipments(subject.order);
  }, [subject]);

  const placedOrder = subject?.kind === 'placed' ? subject.order : null;
  const mappedPlacedOrder = useMemo(
    () => (placedOrder ? mapPlacedOrderToOrder(placedOrder) : null),
    [placedOrder]
  );
  const placedRow = useMemo(
    () =>
      placedOrder && mappedPlacedOrder
        ? toOrderRowData(mappedPlacedOrder, placedOrder)
        : null,
    [placedOrder, mappedPlacedOrder]
  );
  const placedDocumentKind = placedRow ? downloadableDocumentKind(placedRow) : null;
  const trackedPlacedShipments = useMemo(
    () => trackedShipments(placedShipments),
    [placedShipments]
  );
  const pendingRequest =
    subject?.kind === 'pending' ? subject.request : null;
  const pendingDa =
    subject?.kind === 'pending' ? subject.da ?? null : null;
  const checkoutLines =
    subject?.kind === 'checkout-lines' ? subject.lines : null;

  const pendingBadge = pendingRequest
    ? pendingStatusBadge(pendingRequest.status)
    : null;

  const filteredCheckoutLines = useMemo(() => {
    if (!checkoutLines) return [];
    const q = query.trim().toLowerCase();
    if (!q) return checkoutLines;
    return checkoutLines.filter(
      (line) =>
        line.product.partNumber.toLowerCase().includes(q) ||
        line.product.name.toLowerCase().includes(q)
    );
  }, [checkoutLines, query]);

  const title = mappedPlacedOrder
    ? mappedPlacedOrder.salesOrderNumber
    : pendingRequest
      ? `Request ${pendingRequest.requestId}`
      : subject?.kind === 'checkout-lines'
        ? subject.title ?? 'Order items'
        : 'Order details';

  const deliveryLines = useMemo(() => {
    if (!placedOrder || !mappedPlacedOrder) return [];
    return orderDeliveryLines(mappedPlacedOrder, placedOrder);
  }, [placedOrder, mappedPlacedOrder]);

  const shippingReviewHold = Boolean(
    mappedPlacedOrder && isShippingReviewHold(mappedPlacedOrder)
  );
  const specialInstructionsText =
    mappedPlacedOrder?.specialInstructionsText?.trim() ??
    placedOrder?.specialInstructionsText?.trim() ??
    '';

  return (
    <div className="order-detail-panel-viewport" aria-hidden={!open}>
      <ModusWcUtilityPanel
        ref={panelRef as never}
        expanded={open}
        pushContent={false}
        customClass="order-detail-panel"
        aria-label="Order details"
        onPanelClosed={onClose}
      >
        <div slot="header" className="order-detail-header">
          <div className="flex w-full items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="order-detail-eyebrow" hidden={!mappedPlacedOrder}>
              Sales order
            </span>
            <ModusWcTypography
              hierarchy="h2"
              size="md"
              weight="semibold"
              customClass={mappedPlacedOrder ? 'part-number' : undefined}
              label={title}
            />
            {mappedPlacedOrder ? (
              <>
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  weight="semibold"
                  customClass="part-number"
                  label={`PO: ${mappedPlacedOrder.dealerPoNumber}`}
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={`${mappedPlacedOrder.createdByTid} · ${formatWhen(mappedPlacedOrder.placedTimestamp)}`}
                />
              </>
            ) : null}
            {subject?.kind === 'checkout-lines' && subject.frozen ? (
              <ModusWcBadge variant="filled" color="success" size="sm">
                {subject.approvedDaId
                  ? `${subject.approvedDaId} locked`
                  : 'Approved DA locked'}
              </ModusWcBadge>
            ) : null}
          </div>
          <ModusWcButton
            variant="borderless"
            color="tertiary"
            shape="square"
            size="sm"
            aria-label="Close order details"
            onButtonClick={onClose}
          >
            <ModusWcIcon name="close" size="xs" decorative />
          </ModusWcButton>
          </div>
          {placedRow && onDownloadDocument && placedDocumentKind ? (
            <ModusWcButton
              color="primary"
              variant="filled"
              size="sm"
              customClass="order-detail-invoice-btn"
              aria-label={`${invoiceDownloadLabel(placedDocumentKind)} for ${placedRow.salesOrderNumber}`}
              onButtonClick={() =>
                onDownloadDocument(placedRow.salesOrderNumber, placedDocumentKind)
              }
            >
              <ModusWcIcon name="download" size="xs" decorative />
              {invoiceDownloadLabel(placedDocumentKind)}
            </ModusWcButton>
          ) : null}
        </div>

        <div slot="body" className="flex flex-col gap-4">
          {placedOrder ? (
            <>
              {shippingReviewHold ? (
                <>
                  <ModusWcAlert
                    variant="warning"
                    icon="warning"
                    alertTitle="Fulfillment paused for shipping review"
                    alertDescription="Trimble Operations is validating your non-standard shipping request before this order can ship."
                  />
                  {specialInstructionsText ? (
                    <SpecialShippingReviewPanel
                      instructionsText={specialInstructionsText}
                    />
                  ) : null}
                </>
              ) : null}

              <section aria-label="Logistics and delivery">
                <ModusWcTypography
                  hierarchy="h3"
                  size="sm"
                  weight="semibold"
                  label="Logistics and delivery"
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  weight="semibold"
                  label={placedRow?.warehouseSummary ?? placedOrder.shippingAddress.label}
                />
                {placedRow && placedRow.shipmentCount > 1
                  ? null
                  : placedOrder.shippingAddress.lines.map((line) => (
                      <ModusWcTypography
                        key={`ship-line-${line}`}
                        hierarchy="p"
                        size="xs"
                        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                        label={line}
                      />
                    ))}
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={placedRow?.carrierSummary ?? placedOrder.carrier}
                />
                {shippingReviewHold ? (
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    customClass="order-confirmation-delivery-pending"
                    label={DELIVERY_PENDING_SHIPPING_REVIEW}
                  />
                ) : (
                  deliveryLines.map((line, index) => (
                    <ModusWcTypography
                      key={`drawer-delivery-${index}`}
                      hierarchy="p"
                      size="sm"
                      label={formatOrderDeliveryLine(line)}
                    />
                  ))
                )}
                {!shippingReviewHold && trackedPlacedShipments.length > 0 ? (
                  <ul className="order-detail-tracking" aria-label="Waybill tracking">
                    {trackedPlacedShipments.map((shipment) => {
                      const url = carrierTrackingUrl(
                        shipment.carrier,
                        shipment.trackingNumber
                      );
                      return (
                        <li key={shipment.id}>
                          <span className="order-detail-tracking-label">
                            {trackedPlacedShipments.length > 1
                              ? `${shipment.carrier}:`
                              : 'Waybill tracking:'}
                          </span>
                          {url ? (
                            <a
                              className="order-detail-tracking-link part-number"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Track ${shipment.carrier} waybill ${shipment.trackingNumber} (opens in a new tab)`}
                            >
                              {shipment.trackingNumber}
                              <ModusWcIcon name="launch" size="xs" decorative />
                            </a>
                          ) : (
                            <span className="part-number">{shipment.trackingNumber}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>

              {mappedPlacedOrder ? (
                <>
              <ModusWcDivider />

              <div className="flex items-center justify-between gap-2">
                <ModusWcTypography
                  hierarchy="h3"
                  size="sm"
                  weight="semibold"
                  label="Line-item audit"
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={`${mappedPlacedOrder.lineItems.length} ${mappedPlacedOrder.lineItems.length === 1 ? 'line' : 'lines'} · ${formatUsd(mappedPlacedOrder.totalNetPrice)} net`}
                />
              </div>

              <ul className="order-line-list" aria-label="Order line items">
                {mappedPlacedOrder.lineItems.map((item, index) => (
                  <PlacedOrderLineRow
                    key={`${item.pn}-${index}`}
                    item={item}
                    lineNumber={index + 1}
                  />
                ))}
              </ul>

              <ModusWcCollapse
                bordered
                expanded={auditOpen}
                collapseId={`order-audit-${mappedPlacedOrder.salesOrderNumber}`}
                options={{
                  title: 'Audit trail (4-year retention)',
                  size: 'sm',
                  icon: 'history',
                  iconAriaLabel: 'Order audit trail',
                }}
                onExpandedChange={(e: CustomEvent<{ expanded: boolean }>) => {
                  setAuditOpen(e.detail.expanded);
                }}
              >
                <div slot="content" className="flex flex-col gap-2 py-1">
                  {(mappedPlacedOrder.auditTrail ?? []).map((entry, index) => (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="flex flex-col gap-0.5 border-b border-[var(--modus-wc-color-base-200)] pb-2 last:border-0"
                    >
                      <ModusWcTypography
                        hierarchy="p"
                        size="xs"
                        weight="semibold"
                        label={entry.action}
                      />
                      <ModusWcTypography
                        hierarchy="p"
                        size="xs"
                        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                        label={`${formatWhen(entry.timestamp)} · ${entry.tid} from IP ${entry.ipAddress}${entry.location ? ` · ${entry.location}` : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </ModusWcCollapse>

              {placedShipments.length > 1 ? (
                <>
                  <ModusWcDivider />
                  <ModusWcTypography
                    hierarchy="h3"
                    size="sm"
                    weight="semibold"
                    label="Shipment groups"
                  />
                  <div className="order-shipment-stack">
                    {placedShipments.map((shipment, index) => {
                      const lineNumberOffset = placedShipments
                        .slice(0, index)
                        .reduce((sum, s) => sum + s.items.length, 0);
                      return (
                        <div key={shipment.id} className="flex flex-col gap-4">
                          {index > 0 ? <ModusWcDivider /> : null}
                          <ShipmentGroup
                            shipment={shipment}
                            index={index}
                            total={placedShipments.length}
                            lineNumberOffset={lineNumberOffset}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
                </>
              ) : null}
            </>
          ) : null}

          {checkoutLines ? (
            <>
              <ModusWcTextInput
                size="sm"
                includeClear
                includeSearch
                value={query}
                label="Search line items"
                placeholder="Search by part number or title..."
                aria-label="Search items by part number or title"
                onInputChange={(e: CustomEvent) =>
                  setQuery(readInputString(e))
                }
              />

              <div className="flex items-center justify-between gap-2">
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  weight="semibold"
                  label="Line items"
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={`${filteredCheckoutLines.length} of ${checkoutLines.length}`}
                />
              </div>

              <div className="order-line-table-head" aria-hidden="true">
                <span>Product / PN</span>
                <span>Qty / Unit net / Line</span>
              </div>

              {filteredCheckoutLines.length === 0 ? (
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label="No line items match your search."
                />
              ) : (
                <ul className="order-line-list" aria-label="Checkout line items">
                  {filteredCheckoutLines.map((line) => (
                    <CheckoutLineRow key={line.product.id} line={line} />
                  ))}
                </ul>
              )}
            </>
          ) : null}

          {pendingRequest && pendingBadge ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <ModusWcBadge
                  variant="filled"
                  color={pendingBadge.color}
                  size="sm"
                >
                  {pendingRequest.status === 'APPROVED' &&
                  pendingRequest.expiresInDays != null
                    ? `Approved - ${pendingRequest.expiresInDays}d left`
                    : pendingBadge.label}
                </ModusWcBadge>
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={formatWhen(pendingRequest.requestedDate)}
                />
              </div>

              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label={`Ship To: ${pendingRequest.shipTo}`}
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label={`Original: ${formatUsd(pendingRequest.originalTotal)} → Approved: ${formatUsd(pendingRequest.requestedTotal)} (Saves ${formatUsd(pendingRequest.savingsAmount)})`}
              />

              {pendingDa?.justification ? (
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={pendingDa.justification}
                />
              ) : null}

              <ModusWcDivider />

              <ul className="order-line-list" aria-label="Request line items">
                {pendingRequest.items.map((item, index) => (
                  <PendingLineRow
                    key={`${item.partNumber}-${index}`}
                    item={item}
                    lineNumber={index + 1}
                  />
                ))}
              </ul>

              {pendingDa?.status === 'PENDING_APPROVAL' && onSimulate ? (
                <div className="flex flex-col gap-2 pt-1">
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                    label="Prototype: simulate Sales Ops outcome"
                  />
                  <div className="flex flex-wrap gap-2">
                    <ModusWcButton
                      color="tertiary"
                      variant="outlined"
                      size="sm"
                      onButtonClick={() =>
                        onSimulate(pendingDa.id, 'APPROVED')
                      }
                    >
                      Simulate approve
                    </ModusWcButton>
                    <ModusWcButton
                      color="tertiary"
                      variant="outlined"
                      size="sm"
                      onButtonClick={() => onSimulate(pendingDa.id, 'DENIED')}
                    >
                      Simulate deny
                    </ModusWcButton>
                    <ModusWcButton
                      color="tertiary"
                      variant="outlined"
                      size="sm"
                      onButtonClick={() =>
                        onSimulate(pendingDa.id, 'COUNTER_OFFERED')
                      }
                    >
                      Simulate counter
                    </ModusWcButton>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {!placedOrder && !pendingRequest && !checkoutLines ? (
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              label="No order selected."
            />
          ) : null}
        </div>

        <div slot="footer" className="flex justify-end gap-2">
          <ModusWcButton
            variant="outlined"
            color="tertiary"
            size="sm"
            onButtonClick={onClose}
          >
            Close
          </ModusWcButton>
        </div>
      </ModusWcUtilityPanel>
    </div>
  );
}
