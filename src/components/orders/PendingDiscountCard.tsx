import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd } from '../../cart/CartContext';
import {
  isPendingDiscountExpired,
  pendingCountdownBadgeLabel,
} from '../../orders/pendingDiscountHelpers';
import type { PendingDiscountRequest } from '../../orders/types';
import ProductThumbnailStrip from './ProductThumbnailStrip';

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

function lineCountLabel(items: { quantity: number }[]): string {
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const lines = items.length;
  return `${lines} ${lines === 1 ? 'line' : 'lines'} · ${count} ${
    count === 1 ? 'unit' : 'units'
  }`;
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

export type PendingDiscountCardProps = {
  request: PendingDiscountRequest;
  onViewProposal: (request: PendingDiscountRequest) => void;
  onDelete: (sourceDaId: string) => void;
  onCheckout: (sourceDaId: string) => void;
  onResubmit: (sourceDaId: string) => void;
  onEditResubmit: (sourceDaId: string) => void;
};

export default function PendingDiscountCard({
  request,
  onViewProposal,
  onDelete,
  onCheckout,
  onResubmit,
  onEditResubmit,
}: PendingDiscountCardProps) {
  const badge = pendingStatusBadge(request.status);
  const expired = isPendingDiscountExpired(request);
  const countdown = pendingCountdownBadgeLabel(request);
  const badgeLabel = countdown ?? badge.label;
  const badgeColor = expired ? 'danger' : badge.color;
  const canCheckout =
    request.status === 'APPROVED' && !expired && request.items.length > 0;

  return (
    <ModusWcCard bordered={true} padding="compact" customClass="order-macro-card">
      <div className="order-macro-card-body">
        <div className="order-macro-top">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ModusWcTypography
              hierarchy="p"
              size="md"
              weight="semibold"
              customClass="font-mono"
              label={request.requestId}
            />
            <ModusWcBadge variant="filled" color={badgeColor} size="sm">
              {badgeLabel}
            </ModusWcBadge>
          </div>
          <ModusWcTypography
            hierarchy="p"
            size="md"
            weight="bold"
            customClass="tabular-nums"
            label={formatUsd(request.requestedTotal)}
          />
        </div>

        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="order-macro-meta text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={`${formatWhen(request.requestedDate)} · ${lineCountLabel(request.items)} · Ship to ${request.shipTo}`}
        />

        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="order-macro-savings"
          label={`Original: ${formatUsd(request.originalTotal)} → Approved: ${formatUsd(request.requestedTotal)} (Saves ${formatUsd(request.savingsAmount)})`}
        />

        {request.rejectionReason ? (
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={request.rejectionReason}
          />
        ) : null}
        {request.counterOfferLabel ? (
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={request.counterOfferLabel}
          />
        ) : null}

        {expired ? (
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label="This locked cart expired after 30 days. Re-submit or delete the request."
          />
        ) : null}

        <div className="order-macro-bottom">
          <ProductThumbnailStrip
            items={request.items}
            onShowMore={() => onViewProposal(request)}
          />
          <div className="order-macro-actions">
            {expired ? (
              <>
                <ModusWcButton
                  color="primary"
                  variant="filled"
                  size="sm"
                  aria-label={`Re-submit request ${request.requestId}`}
                  onButtonClick={() => onResubmit(request.sourceDaId)}
                >
                  <ModusWcIcon name="refresh" size="xs" decorative />
                  Re-submit request
                </ModusWcButton>
                <ModusWcButton
                  color="danger"
                  variant="outlined"
                  size="sm"
                  aria-label={`Delete expired request ${request.requestId}`}
                  onButtonClick={() => onDelete(request.sourceDaId)}
                >
                  <ModusWcIcon name="delete" size="xs" decorative />
                  Delete
                </ModusWcButton>
              </>
            ) : (
              <>
                {request.status === 'REJECTED' && !expired ? (
                  <>
                    <ModusWcButton
                      color="primary"
                      variant="outlined"
                      size="sm"
                      aria-label={`Edit and resubmit ${request.requestId}`}
                      onButtonClick={() => onEditResubmit(request.sourceDaId)}
                    >
                      <ModusWcIcon name="file_edit" size="xs" decorative />
                      Edit and resubmit request
                    </ModusWcButton>
                    <ModusWcButton
                      color="danger"
                      variant="outlined"
                      size="sm"
                      aria-label={`Delete request ${request.requestId}`}
                      onButtonClick={() => onDelete(request.sourceDaId)}
                    >
                      <ModusWcIcon name="delete" size="xs" decorative />
                      Delete request
                    </ModusWcButton>
                  </>
                ) : null}

                {request.status === 'UNDER_REVIEW' ? (
                  <ModusWcButton
                    color="danger"
                    variant="outlined"
                    size="sm"
                    aria-label={`Delete request ${request.requestId}`}
                    onButtonClick={() => onDelete(request.sourceDaId)}
                  >
                    <ModusWcIcon name="delete" size="xs" decorative />
                    Delete request
                  </ModusWcButton>
                ) : null}

                <ModusWcButton
                  color="tertiary"
                  variant="outlined"
                  size="sm"
                  aria-label={`View proposal for ${request.requestId}`}
                  onButtonClick={() => onViewProposal(request)}
                >
                  <ModusWcIcon name="visibility_on" size="xs" decorative />
                  View proposal
                </ModusWcButton>

                {canCheckout ? (
                  <ModusWcButton
                    color="primary"
                    variant="filled"
                    size="sm"
                    aria-label={`Proceed to checkout for ${request.requestId}`}
                    onButtonClick={() => onCheckout(request.sourceDaId)}
                  >
                    <ModusWcIcon name="shopping_cart" size="xs" decorative />
                    Proceed to checkout
                  </ModusWcButton>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </ModusWcCard>
  );
}
