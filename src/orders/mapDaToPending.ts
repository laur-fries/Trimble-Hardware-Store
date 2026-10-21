import { parsePrice } from '../catalogData';
import type { DaRequest } from '../da/types';
import { getAddressById, SHIPPING_ADDRESSES } from '../checkout/checkoutData';
import { enrichLineItems } from './lineItemHelpers';
import type { LineItem, PendingDiscountRequest } from './types';

function computeRequestedTotal(request: DaRequest): number {
  if (request.status === 'APPROVED' && request.approvedNetTotal != null) {
    return request.approvedNetTotal;
  }
  if (request.discountType === 'percentage') {
    return (
      Math.round(
        request.dealerSubtotalAtSubmit * (1 - request.discountValue / 100) * 100
      ) / 100
    );
  }
  return Math.max(0, request.dealerSubtotalAtSubmit - request.discountValue);
}

function mapStatus(
  status: DaRequest['status']
): PendingDiscountRequest['status'] | null {
  switch (status) {
    case 'PENDING_APPROVAL':
    case 'COUNTER_OFFERED':
      return 'UNDER_REVIEW';
    case 'APPROVED':
      return 'APPROVED';
    case 'DENIED':
      return 'REJECTED';
    case 'ORDERED':
      return null;
  }
}

function expiresInDays(expiresAt?: string): number | undefined {
  if (!expiresAt) return undefined;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return undefined;
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function shipToLabel(request: DaRequest): string {
  const shipToId = request.lines[0]?.shipToId;
  if (shipToId) {
    return getAddressById(shipToId)?.nickname ?? SHIPPING_ADDRESSES[0].nickname;
  }
  return SHIPPING_ADDRESSES[0].nickname;
}

function toLineItems(request: DaRequest): LineItem[] {
  return enrichLineItems(
    request.lines.map(
      (line): LineItem => ({
        partNumber: line.product.partNumber,
        title: line.product.name,
        quantity: line.quantity,
        unitPrice: parsePrice(line.product.price),
        image: line.product.image,
      })
    )
  );
}

/** Map live DA records into the Orders pending-discount view model. */
export function mapDaToPendingDiscount(
  request: DaRequest
): PendingDiscountRequest | null {
  const status = mapStatus(request.status);
  if (!status) return null;

  const originalTotal = request.dealerSubtotalAtSubmit;
  const requestedTotal = computeRequestedTotal(request);
  const savingsAmount = Math.max(0, originalTotal - requestedTotal);

  return {
    requestId: request.id,
    sourceDaId: request.id,
    requestedDate: request.createdAt,
    originalTotal,
    requestedTotal,
    savingsAmount,
    shipTo: shipToLabel(request),
    items: toLineItems(request),
    status,
    expiresInDays:
      status === 'APPROVED' ? expiresInDays(request.expiresAt) : undefined,
    rejectionReason:
      status === 'REJECTED' ? request.reviewerNotes : undefined,
    counterOfferLabel:
      request.status === 'COUNTER_OFFERED'
        ? request.reviewerNotes ||
          (request.discountType === 'percentage'
            ? `Counter-offer: ${request.counterOfferValue}%`
            : `Counter-offer: $${(request.counterOfferValue ?? 0).toLocaleString('en-US')}`)
        : undefined,
  };
}

export function mapDaListToPending(
  requests: DaRequest[]
): PendingDiscountRequest[] {
  return requests
    .map(mapDaToPendingDiscount)
    .filter((row): row is PendingDiscountRequest => row !== null);
}
