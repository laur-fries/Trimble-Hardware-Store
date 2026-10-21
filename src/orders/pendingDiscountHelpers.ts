import type { PendingDiscountRequest } from './types';

const APPROVAL_WINDOW_DAYS = 30;

export function pendingExpirationDays(
  request: PendingDiscountRequest
): number | null {
  if (request.status !== 'APPROVED' && request.status !== 'REJECTED') {
    return null;
  }
  if (request.expiresInDays == null) return null;
  return request.expiresInDays;
}

export function isPendingDiscountExpired(
  request: PendingDiscountRequest
): boolean {
  const days = pendingExpirationDays(request);
  if (days == null) return false;
  return days <= 0;
}

export function pendingCountdownBadgeLabel(
  request: PendingDiscountRequest
): string | null {
  if (request.status === 'UNDER_REVIEW') return null;
  if (isPendingDiscountExpired(request)) return 'Expired';
  const days = pendingExpirationDays(request);
  if (days == null) return null;

  const expiry = new Date(request.requestedDate);
  expiry.setDate(expiry.getDate() + APPROVAL_WINDOW_DAYS);
  const expiryLabel = expiry.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (request.status === 'APPROVED') {
    return `Approved — Expires ${expiryLabel} (${days} days left)`;
  }
  return `Rejected — ${days}d left`;
}

export { APPROVAL_WINDOW_DAYS };
