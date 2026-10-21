import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ModusWcBadge,
  ModusWcCard,
  ModusWcTabs,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { ITab } from '@trimble-oss/moduswebcomponents';
import { formatUsd, useCart } from '../cart/CartContext';
import { findCatalogProduct } from '../catalog/productLookup';
import OrdersTable from '../components/orders/OrdersTable';
import OrderDetailDrawer, {
  type OrderDetailSubject,
} from '../components/orders/OrderDetailDrawer';
import OrdersToolbar, {
  DEFAULT_ORDER_FILTERS,
} from '../components/orders/OrdersToolbar';
import PendingDiscountCard from '../components/orders/PendingDiscountCard';
import ReorderDiscontinuedModal, {
  openReorderDiscontinuedModal,
  type DiscontinuedReorderLine,
} from '../components/orders/ReorderDiscontinuedModal';
import TransactionIssueModal, {
  openTransactionIssueModal,
} from '../components/orders/TransactionIssueModal';
import { openDARequestModal } from '../components/da/DARequestModal';
import { useDaRequests } from '../da/DaContext';
import {
  downloadDocumentStub,
  lineItemToCatalogProduct,
} from '../orders/lineItemHelpers';
import { mapPlacedOrderToOrder, mapPlacedOrdersToOrders } from '../orders/mapPlacedOrderToOrder';
import { mapDaListToPending } from '../orders/mapDaToPending';
import { toOrderRowData } from '../orders/orderRows';
import {
  filterOrders,
  filterPendingByQuery,
  type OrderListFilters,
} from '../orders/orderFilters';
import AccountAuditLogsTab from '../components/orders/AccountAuditLogsTab';
import InvoicesTab from '../components/orders/InvoicesTab';
import {
  SEED_ACCOUNT_AUDIT_LOGS,
  filterAccountAuditLogs,
} from '../orders/accountAuditLogsData';
import {
  buildInvoiceDocuments,
  filterInvoiceDocuments,
  type InvoiceDocumentRow,
} from '../orders/invoiceDocuments';
import { SEED_PLACED_ORDERS } from '../orders/placedOrdersData';
import type { PendingDiscountRequest, PlacedOrder } from '../orders/types';
import type { InvoiceDocumentKind, Order } from '../types/order';

const PLACED_TAB_SLOT = 'orders-placed-tab';
const PENDING_TAB_SLOT = 'orders-pending-tab';

function tabIndexFromParam(tab: string | null): number {
  if (tab === 'pending' || tab === 'approvals') return 1;
  if (tab === 'invoices') return 2;
  if (tab === 'audit') return 3;
  return 0;
}

function tabParamFromIndex(index: number): string | null {
  if (index === 1) return 'pending';
  if (index === 2) return 'invoices';
  if (index === 3) return 'audit';
  return null;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addQuantities } = useCart();
  const {
    requests,
    deleteRequest,
    simulateStatus,
  } = useDaRequests();

  const [filters, setFilters] = useState<OrderListFilters>(
    DEFAULT_ORDER_FILTERS
  );
  const pendingRequests = useMemo(
    () => mapDaListToPending(requests),
    [requests]
  );
  const activePendingCount = pendingRequests.length;

  const tabFromUrl = tabIndexFromParam(searchParams.get('tab'));
  const [tab, setTab] = useState(tabFromUrl);
  const [toast, setToast] = useState<string | null>(null);
  const [detailSubject, setDetailSubject] = useState<OrderDetailSubject | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [supportOrderNumber, setSupportOrderNumber] = useState('');
  const [supportDealerPo, setSupportDealerPo] = useState('');
  const [reorderLines, setReorderLines] = useState<DiscontinuedReorderLine[]>(
    []
  );
  const [pendingReorder, setPendingReorder] = useState<PlacedOrder | null>(
    null
  );

  const placedById = useMemo(() => {
    const map = new Map<string, PlacedOrder>();
    for (const order of SEED_PLACED_ORDERS) map.set(order.id, order);
    return map;
  }, []);

  const mappedOrders = useMemo(
    () => mapPlacedOrdersToOrders(SEED_PLACED_ORDERS),
    []
  );

  const filteredPlaced = useMemo(
    () => filterOrders(mappedOrders, filters),
    [mappedOrders, filters]
  );

  const placedRows = useMemo(
    () =>
      filteredPlaced.flatMap((order) => {
        const placed = placedById.get(order.sourcePlacedOrderId);
        return placed ? [toOrderRowData(order, placed)] : [];
      }),
    [filteredPlaced, placedById]
  );

  const withPlaced = (so: string, run: (placed: PlacedOrder) => void) => {
    const placed = placedById.get(so);
    if (placed) run(placed);
  };

  const filteredPending = useMemo(
    () => filterPendingByQuery(pendingRequests, filters.query),
    [pendingRequests, filters.query]
  );

  const invoiceDocuments = useMemo(
    () => filterInvoiceDocuments(buildInvoiceDocuments(mappedOrders), filters.query),
    [mappedOrders, filters.query]
  );

  const auditLogs = useMemo(
    () => filterAccountAuditLogs(SEED_ACCOUNT_AUDIT_LOGS, filters.query),
    [filters.query]
  );

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const openPendingDaId =
    detailOpen && detailSubject?.kind === 'pending'
      ? detailSubject.request.sourceDaId
      : null;

  useEffect(() => {
    if (!openPendingDaId) return;
    const da = requests.find((r) => r.id === openPendingDaId);
    if (!da) {
      setDetailOpen(false);
      setDetailSubject(null);
      return;
    }
    const mapped = mapDaListToPending([da])[0];
    if (!mapped) {
      setDetailOpen(false);
      setDetailSubject(null);
      return;
    }
    setDetailSubject({ kind: 'pending', request: mapped, da });
  }, [requests, openPendingDaId]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4200);
  };

  const tabs: ITab[] = useMemo(
    () => [
      { slotName: PLACED_TAB_SLOT },
      { slotName: PENDING_TAB_SLOT },
      { label: 'Invoices & Proformas' },
      { label: 'Account Audit Logs' },
    ],
    []
  );

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailSubject(null);
  };

  const openPlacedDetail = (order: PlacedOrder) => {
    setDetailSubject({ kind: 'placed', order });
    setDetailOpen(true);
  };

  const openPendingDetail = (request: PendingDiscountRequest) => {
    const da = requests.find((r) => r.id === request.sourceDaId) ?? null;
    setDetailSubject({ kind: 'pending', request, da });
    setDetailOpen(true);
  };

  const setActiveTab = (next: number) => {
    setTab(next);
    const param = tabParamFromIndex(next);
    if (param) {
      setSearchParams({ tab: param }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const downloadInvoice = (order: PlacedOrder, kind: InvoiceDocumentKind) => {
    const isProforma = kind === 'PROFORMA';
    const label = isProforma ? 'Proforma Invoice' : 'Tax Invoice';
    downloadDocumentStub(
      `${order.id}-${isProforma ? 'proforma' : 'tax'}-invoice.pdf`,
      `Trimble Hardware Store — ${label}\nOrder: ${order.id}\nDealer PO: ${order.dealerPo}\nTotal: ${formatUsd(order.total)}\n\n(Prototype PDF stub)`
    );
    showToast(`${label} downloaded for ${order.id}`);
  };

  const handlePackout = (order: PlacedOrder) => {
    const mapped = mapPlacedOrderToOrder(order);
    if (mapped.digitalPackoutUrl?.startsWith('#')) {
      showToast(`Packout list opened for ${order.id} (serial numbers)`);
      return;
    }
    const lines = order.items
      .map(
        (item) =>
          `${item.partNumber}\tQty ${item.quantity}\t${item.title}\tS/N: DEMO-${item.partNumber}-001`
      )
      .join('\n');
    downloadDocumentStub(
      `${order.id}-packout.pdf`,
      `Trimble Hardware Store — Packout List\nOrder: ${order.id}\nShip to: ${order.shipTo}\nCarrier: ${order.carrier}\n\n${lines}\n\n(Prototype PDF stub)`
    );
    showToast(`Packout list downloaded for ${order.id}`);
  };

  const addPlacedOrderToCart = (order: PlacedOrder, lines?: DiscontinuedReorderLine[]) => {
    const entries = order.items
      .map((item) => {
        const override = lines?.find((l) => l.pn === item.partNumber);
        if (override?.isDiscontinued && !override.useReplacement) {
          return null;
        }
        const pn =
          override?.useReplacement && override.replacementPn
            ? override.replacementPn
            : item.partNumber;
        const product =
          findCatalogProduct(pn) ??
          lineItemToCatalogProduct({ ...item, partNumber: pn });
        return { product, quantity: item.quantity };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);

    const addedUnits = entries.reduce((sum, e) => sum + e.quantity, 0);
    addQuantities(entries);
    showToast(`Added ${addedUnits} units from ${order.id} to cart`);
  };

  const handleReorderAll = (order: PlacedOrder) => {
    const mapped = mapPlacedOrderToOrder(order);
    const discontinued = mapped.lineItems.filter((line) => line.isDiscontinued);
    if (discontinued.length > 0) {
      setPendingReorder(order);
      setReorderLines(
        mapped.lineItems.map((line) => ({
          ...line,
          useReplacement: false,
        }))
      );
      openReorderDiscontinuedModal();
      return;
    }
    addPlacedOrderToCart(order);
  };

  const handleReportIssue = (order: Order) => {
    setSupportOrderNumber(order.salesOrderNumber);
    setSupportDealerPo(order.dealerPoNumber);
    openTransactionIssueModal();
  };

  const handleDownloadInvoiceDoc = (doc: InvoiceDocumentRow) => {
    const placed = placedById.get(doc.salesOrderNumber);
    if (!placed) return;
    downloadInvoice(
      placed,
      doc.documentType === 'Proforma Invoice' ? 'PROFORMA' : 'INVOICE'
    );
  };

  return (
    <div className="page-container py-8">
      <div className="mb-4 flex flex-col gap-2">
        <ModusWcTypography
          hierarchy="h1"
          size="2xl"
          weight="semibold"
          label="Your Orders"
        />
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Track placed sales orders, discretionary discount approvals, invoices, and account activity (retained for five years)."
        />
      </div>

      <OrdersToolbar filters={filters} onChange={setFilters} />

      {toast ? (
        <div className="mb-4" role="status" aria-live="polite">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label={toast}
          />
        </div>
      ) : null}

      <ModusWcTabs
        size="md"
        tabStyle="bordered"
        tabs={tabs}
        activeTabIndex={tab}
        aria-label="Orders sections"
        onTabChange={(
          e: CustomEvent<{ previousTab: number; newTab: number }>
        ) => setActiveTab(e.detail.newTab)}
      >
        <span slot={PLACED_TAB_SLOT} className="inline-flex items-center gap-2">
          Placed Orders
          <ModusWcBadge color="tertiary" size="sm" variant="counter">
            {String(placedRows.length)}
          </ModusWcBadge>
        </span>
        <span
          slot={PENDING_TAB_SLOT}
          className="inline-flex items-center gap-2"
        >
          Pending Approvals
          <span
            className="orders-pending-count"
            hidden={activePendingCount === 0}
            aria-hidden={activePendingCount === 0}
          >
            <ModusWcBadge color="primary" size="sm" variant="counter">
              {activePendingCount > 99 ? '99+' : String(activePendingCount)}
            </ModusWcBadge>
          </span>
        </span>
      </ModusWcTabs>

      <div
        className="orders-tab-panel mt-6"
        hidden={tab !== 0}
        aria-hidden={tab !== 0}
      >
        {filteredPlaced.length === 0 ? (
          <ModusWcCard bordered={true} padding="comfortable">
            <div className="flex flex-col items-start gap-2 px-1 py-2">
              <ModusWcTypography
                hierarchy="h2"
                size="lg"
                weight="semibold"
                label="No orders match your filters"
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label="Adjust search or filters, or place a new order from Shop Hardware."
              />
            </div>
          </ModusWcCard>
        ) : (
          <OrdersTable
            orders={placedRows}
            onViewDetails={(so) => withPlaced(so, openPlacedDetail)}
            onDownloadDocument={(so, kind) =>
              withPlaced(so, (placed) => downloadInvoice(placed, kind))
            }
            onReorder={(so) => withPlaced(so, handleReorderAll)}
            onPackout={(so) => withPlaced(so, handlePackout)}
            onReportIssue={(so) => {
              const order = mappedOrders.find((o) => o.salesOrderNumber === so);
              if (order) handleReportIssue(order);
            }}
          />
        )}
      </div>

      <div
        className="orders-tab-panel mt-6"
        hidden={tab !== 1}
        aria-hidden={tab !== 1}
      >
        {filteredPending.length === 0 ? (
          <ModusWcCard bordered={true} padding="comfortable">
            <div className="flex flex-col items-start gap-2 px-1 py-2">
              <ModusWcTypography
                hierarchy="h2"
                size="lg"
                weight="semibold"
                label="No pending orders"
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label="When you submit a Discretionary Discount (DA) request, the locked cart appears here while Sales Ops reviews it."
              />
            </div>
          </ModusWcCard>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Pending orders">
            {filteredPending.map((request) => (
              <li key={request.requestId}>
                <PendingDiscountCard
                  request={request}
                  onViewProposal={openPendingDetail}
                  onDelete={(id) => {
                    deleteRequest(id);
                    if (
                      detailSubject?.kind === 'pending' &&
                      detailSubject.request.sourceDaId === id
                    ) {
                      closeDetail();
                    }
                  }}
                  onCheckout={(id) =>
                    navigate('/checkout', { state: { lockedDaId: id } })
                  }
                  onResubmit={() => {
                    openDARequestModal();
                    showToast('Re-submit your discretionary discount request.');
                  }}
                  onEditResubmit={() => {
                    openDARequestModal();
                    showToast(
                      'Discretionary discount modal opened with your prior request (prototype).'
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="orders-tab-panel mt-6"
        hidden={tab !== 2}
        aria-hidden={tab !== 2}
      >
        <InvoicesTab
          documents={invoiceDocuments}
          onDownload={handleDownloadInvoiceDoc}
        />
      </div>

      <div
        className="orders-tab-panel mt-6"
        hidden={tab !== 3}
        aria-hidden={tab !== 3}
      >
        <AccountAuditLogsTab logs={auditLogs} />
      </div>

      <OrderDetailDrawer
        open={detailOpen}
        subject={detailSubject}
        onClose={closeDetail}
        onDownloadDocument={(so, kind) =>
          withPlaced(so, (placed) => downloadInvoice(placed, kind))
        }
        onSimulate={(id, status) => {
          const request = requests.find((r) => r.id === id);
          simulateStatus(id, status);
          const email = request?.submittedByEmail ?? 'your TID email';
          const label =
            status === 'APPROVED'
              ? 'approved'
              : status === 'DENIED'
                ? 'denied'
                : 'counter-offered';
          showToast(
            `DA ${id} ${label}. In-app and email notice routed to ${email}.`
          );
        }}
      />

      <TransactionIssueModal
        salesOrderNumber={supportOrderNumber}
        dealerPoNumber={supportDealerPo}
        onSubmit={() =>
          showToast(`Support request logged for ${supportOrderNumber}.`)
        }
      />

      <ReorderDiscontinuedModal
        lines={reorderLines}
        onConfirm={(lines) => {
          if (pendingReorder) addPlacedOrderToCart(pendingReorder, lines);
          setPendingReorder(null);
        }}
      />
    </div>
  );
}
