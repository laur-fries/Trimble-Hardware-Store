import { formatUsd } from '../../cart/CartContext';
import type { ConfirmationPricing } from '../../checkout/confirmation';
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function formatPlacedOn(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export type OrderConfirmationSummarySidebarProps = {
  salesOrderNumber: string;
  dealerPoNumber: string;
  placedByTid: string;
  placedTimestamp: string;
  paymentTerms: string;
  netTotal: number;
  pricing?: ConfirmationPricing;
  onTrackInOrders: () => void;
  onDownloadProforma: () => void;
  onContactSupport: () => void;
};

export default function OrderConfirmationSummarySidebar(
  props: OrderConfirmationSummarySidebarProps
) {
  const {
    salesOrderNumber,
    dealerPoNumber,
    placedByTid,
    placedTimestamp,
    paymentTerms,
    netTotal,
    pricing,
    onTrackInOrders,
    onDownloadProforma,
    onContactSupport,
  } = props;

  return (
    <ModusWcCard
      bordered={true}
      padding="compact"
      customClass="order-confirmation-summary-card"
    >
      <div slot="title">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Order details"
        />
      </div>

      <dl className="order-confirmation-summary-dl">
        <div>
          <dt>Trimble sales order</dt>
          <dd>{salesOrderNumber}</dd>
        </div>
        <div>
          <dt>Dealer PO</dt>
          <dd>{dealerPoNumber || '—'}</dd>
        </div>
        <div>
          <dt>Placed by</dt>
          <dd>{placedByTid}</dd>
        </div>
        <div>
          <dt>Placed on</dt>
          <dd>{formatPlacedOn(placedTimestamp)}</dd>
        </div>
        <div>
          <dt>Payment terms</dt>
          <dd>{paymentTerms}</dd>
        </div>
      </dl>

      <ModusWcDivider />

      <dl className="order-confirmation-pricing">
        {pricing ? (
          <>
            <PriceRow label="Subtotal (MSRP)" value={formatUsd(pricing.subtotalMsrp)} />
            <PriceRow
              label="Dealer discount (10%)"
              value={`-${formatUsd(pricing.dealerDiscount)}`}
            />
            <PriceRow
              label="KPI discount (2%)"
              value={`-${formatUsd(pricing.kpiDiscount)}`}
            />
            {pricing.promoSavings > 0 ? (
              <PriceRow
                label="Promo"
                value={`-${formatUsd(pricing.promoSavings)}`}
              />
            ) : null}
            <PriceRow
              label="Estimated tax (8.25%)"
              value={formatUsd(pricing.estimatedTax)}
            />
          </>
        ) : null}
        <div className="order-confirmation-pricing-total">
          <dt>Net total</dt>
          <dd className="tabular-nums">{formatUsd(netTotal)}</dd>
        </div>
      </dl>

      <ModusWcDivider />

      <div className="order-confirmation-summary-actions">
        <ModusWcButton
          color="primary"
          variant="filled"
          size="sm"
          aria-label="View all orders"
          onButtonClick={onTrackInOrders}
        >
          <ModusWcIcon name="list" size="xs" decorative />
          View all orders
        </ModusWcButton>
        <ModusWcButton
          color="tertiary"
          variant="outlined"
          size="sm"
          aria-label={`Download proforma invoice for ${salesOrderNumber} as PDF`}
          onButtonClick={onDownloadProforma}
        >
          <ModusWcIcon name="download" size="xs" decorative />
          Download proforma invoice (PDF)
        </ModusWcButton>
        <ModusWcButton
          color="tertiary"
          variant="borderless"
          size="sm"
          customClass="self-start"
          aria-label={`Contact Trimble support about ${salesOrderNumber}`}
          onButtonClick={onContactSupport}
        >
          Need help with this order? Contact Trimble Support
        </ModusWcButton>
      </div>
    </ModusWcCard>
  );
}
