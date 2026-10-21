import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartLine } from '../cart/CartContext';
import { getLineTotal } from '../cart/bomHelpers';
import { catalogProducts } from '../catalogData';
import {
  CURRENT_USER_TID,
  type DaRequest,
  type DaStatus,
  type DaSubmitPayload,
} from './types';

interface DaContextValue {
  requests: DaRequest[];
  submitRequest: (lines: CartLine[], payload: DaSubmitPayload) => DaRequest;
  deleteRequest: (id: string) => void;
  dismissRequest: (id: string) => void;
  getRequest: (id: string) => DaRequest | undefined;
  /** Prototype helper: move a pending request to approved / denied / counter. */
  simulateStatus: (id: string, status: Exclude<DaStatus, 'PENDING_APPROVAL' | 'ORDERED'>) => void;
  markOrdered: (id: string, salesOrderNumber: string) => void;
}

const DaContext = createContext<DaContextValue | null>(null);

const STORAGE_KEY = 'trimble-hardware-store-da-requests';

function generateRequestId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `DA-2026-${n}`;
}

function cloneLines(lines: CartLine[]): CartLine[] {
  return lines.map((line) => ({
    ...line,
    product: { ...line.product },
    bomSelection: line.bomSelection
      ? Object.fromEntries(
          Object.entries(line.bomSelection).map(([pn, row]) => [pn, { ...row }])
        )
      : undefined,
  }));
}

function loadRequests(): DaRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedRequests();
    const parsed = JSON.parse(raw) as DaRequest[];
    return Array.isArray(parsed) ? parsed : createSeedRequests();
  } catch {
    return createSeedRequests();
  }
}

/** Demo rows so Your Orders → Pending tab is not empty on first visit. */
function createSeedRequests(): DaRequest[] {
  const now = Date.now();
  const r780 = catalogProducts.find((p) => p.id === 'prod-1');
  const tsc7 = catalogProducts.find((p) => p.id === 'prod-2');
  const approvedLines: CartLine[] =
    r780 && tsc7
      ? [
          { product: r780, quantity: 1, shipToId: 'tx-yard' },
          { product: tsc7, quantity: 2, shipToId: 'tx-yard' },
        ]
      : [];
  const approvedDealer = approvedLines.reduce(
    (sum, line) => sum + getLineTotal(line),
    0
  );
  const approvedItemCount = approvedLines.reduce(
    (sum, line) => sum + line.quantity,
    0
  );

  return [
    {
      id: 'DA-2026-8820',
      status: 'APPROVED',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      submittedByTid: CURRENT_USER_TID.tid,
      submittedByEmail: CURRENT_USER_TID.email,
      discountType: 'percentage',
      discountValue: 12,
      justification: 'Competitive bid — multi-machine Earthworks package.',
      lines: approvedLines,
      itemCount: approvedItemCount || 3,
      dealerSubtotalAtSubmit: approvedDealer || 28600,
      approvedNetTotal:
        Math.round((approvedDealer || 28600) * 0.88 * 100) / 100,
      expiresAt: new Date(now + 27 * 24 * 60 * 60 * 1000).toISOString(),
      auditLog: [
        {
          timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
          message: `User ${CURRENT_USER_TID.tid} submitted DA request DA-2026-8820 for 12%.`,
        },
        {
          timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Sales Ops approved DA-2026-8820. Pricing honored for 30 days.',
        },
      ],
    },
    {
      id: 'DA-2026-7712',
      status: 'DENIED',
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      submittedByTid: CURRENT_USER_TID.tid,
      submittedByEmail: CURRENT_USER_TID.email,
      discountType: 'flat',
      discountValue: 4500,
      justification: 'End-of-quarter stock rotation.',
      lines: tsc7
        ? [{ product: tsc7, quantity: 2, shipToId: 'tx-yard' }]
        : [],
      itemCount: 2,
      dealerSubtotalAtSubmit: tsc7 ? getLineTotal({ product: tsc7, quantity: 2 }) : 9200,
      reviewerNotes:
        'Requested flat discount exceeds program authority. Resubmit with competitive documentation.',
      auditLog: [
        {
          timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          message: `User ${CURRENT_USER_TID.tid} submitted DA request DA-2026-7712 for $4,500.`,
        },
        {
          timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Sales Ops denied DA-2026-7712.',
        },
      ],
    },
  ];
}

function persist(requests: DaRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function DaProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<DaRequest[]>(() => loadRequests());

  useEffect(() => {
    persist(requests);
  }, [requests]);

  const submitRequest = useCallback(
    (lines: CartLine[], payload: DaSubmitPayload): DaRequest => {
      const id = generateRequestId();
      const createdAt = new Date().toISOString();
      const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
      const dealerSubtotalAtSubmit = lines.reduce(
        (sum, line) => sum + getLineTotal(line),
        0
      );
      const amountLabel =
        payload.discountType === 'percentage'
          ? `${payload.discountValue}%`
          : `$${payload.discountValue.toLocaleString('en-US')}`;

      const next: DaRequest = {
        id,
        status: 'PENDING_APPROVAL',
        createdAt,
        submittedByTid: CURRENT_USER_TID.tid,
        submittedByEmail: CURRENT_USER_TID.email,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        justification: payload.justification.trim(),
        poFileName: payload.poFileName,
        lines: cloneLines(lines),
        itemCount,
        dealerSubtotalAtSubmit,
        auditLog: [
          {
            timestamp: createdAt,
            message: `User ${CURRENT_USER_TID.tid} submitted DA request ${id} for ${amountLabel}. Notification routed to ${CURRENT_USER_TID.email}.`,
          },
        ],
      };

      setRequests((prev) => [next, ...prev]);
      return next;
    },
    []
  );

  const deleteRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const dismissRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests]
  );

  const simulateStatus = useCallback(
    (id: string, status: Exclude<DaStatus, 'PENDING_APPROVAL' | 'ORDERED'>) => {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const timestamp = new Date().toISOString();
          if (status === 'APPROVED') {
            const approvedNet =
              r.discountType === 'percentage'
                ? r.dealerSubtotalAtSubmit * (1 - r.discountValue / 100)
                : Math.max(0, r.dealerSubtotalAtSubmit - r.discountValue);
            return {
              ...r,
              status,
              approvedNetTotal: Math.round(approvedNet * 100) / 100,
              expiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              auditLog: [
                ...r.auditLog,
                {
                  timestamp,
                  message: `Sales Ops approved ${r.id}. Pricing honored for 30 days. Notice sent to ${r.submittedByEmail}.`,
                },
              ],
            };
          }
          if (status === 'DENIED') {
            return {
              ...r,
              status,
              reviewerNotes:
                r.reviewerNotes ||
                'Request denied — discount not aligned with current program guidelines.',
              auditLog: [
                ...r.auditLog,
                {
                  timestamp,
                  message: `Sales Ops denied ${r.id}. Notice sent to ${r.submittedByEmail}.`,
                },
              ],
            };
          }
          return {
            ...r,
            status: 'COUNTER_OFFERED',
            counterOfferValue:
              r.discountType === 'percentage'
                ? Math.max(1, Math.round(r.discountValue * 0.6))
                : Math.round(r.discountValue * 0.5),
            reviewerNotes:
              'Counter-offer issued. Review revised terms before proceeding.',
            auditLog: [
              ...r.auditLog,
              {
                timestamp,
                message: `Sales Ops counter-offered on ${r.id}. Notice sent to ${r.submittedByEmail}.`,
              },
            ],
          };
        })
      );
    },
    []
  );

  const markOrdered = useCallback((id: string, salesOrderNumber: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: 'ORDERED' as const,
          auditLog: [
            ...r.auditLog,
            {
              timestamp: new Date().toISOString(),
              message: `Locked cart ${r.id} converted to sales order ${salesOrderNumber}.`,
            },
          ],
        };
      })
    );
  }, []);

  const value = useMemo(
    () => ({
      requests,
      submitRequest,
      deleteRequest,
      dismissRequest,
      getRequest,
      simulateStatus,
      markOrdered,
    }),
    [
      requests,
      submitRequest,
      deleteRequest,
      dismissRequest,
      getRequest,
      simulateStatus,
      markOrdered,
    ]
  );

  return <DaContext.Provider value={value}>{children}</DaContext.Provider>;
}

export function useDaRequests() {
  const ctx = useContext(DaContext);
  if (!ctx) {
    throw new Error('useDaRequests must be used within DaProvider');
  }
  return ctx;
}
