import type { CartLine } from '../cart/CartContext';

export type DaStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'DENIED'
  | 'COUNTER_OFFERED'
  | 'ORDERED';

export type DiscountType = 'percentage' | 'flat';

export interface DaAuditEntry {
  timestamp: string;
  message: string;
}

export interface DaRequest {
  id: string;
  status: DaStatus;
  createdAt: string;
  submittedByTid: string;
  submittedByEmail: string;
  discountType: DiscountType;
  discountValue: number;
  justification: string;
  poFileName?: string;
  /** Frozen cart lines at submit time. */
  lines: CartLine[];
  itemCount: number;
  dealerSubtotalAtSubmit: number;
  /** Honored dealer net when approved (30-day lock). */
  approvedNetTotal?: number;
  reviewerNotes?: string;
  counterOfferValue?: number;
  /** ISO expiry for approved pricing (30 days). */
  expiresAt?: string;
  auditLog: DaAuditEntry[];
}

export interface DaSubmitPayload {
  discountType: DiscountType;
  discountValue: number;
  justification: string;
  poFileName?: string;
}

/** Logged-in dealer TID identity used for DA notifications (prototype). */
export const CURRENT_USER_TID = {
  tid: 'TID-JR-88421',
  name: 'Jordan Rivera',
  email: 'jordan.rivera@trimble.com',
  accountName: 'Enterprise ABC',
};
