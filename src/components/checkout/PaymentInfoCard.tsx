import {
  ModusWcCard,
  ModusWcTextInput,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import {
  BILLING_ACCOUNT,
  formatBillingAddress,
} from '../../checkout/checkoutData';
import { readInputString } from '../../utils/modusFormEvents';

interface PaymentInfoCardProps {
  dealerPoNumber: string;
  dealerPoError?: string | null;
  onDealerPoNumberChange: (value: string) => void;
  billingContact?: string;
  billingError?: string | null;
  requireBillingContact?: boolean;
  onBillingContactChange?: (value: string) => void;
}

export default function PaymentInfoCard({
  dealerPoNumber,
  dealerPoError = null,
  onDealerPoNumberChange,
  billingContact = '',
  billingError = null,
  requireBillingContact = false,
  onBillingContactChange,
}: PaymentInfoCardProps) {
  const billing = BILLING_ACCOUNT;

  return (
    <ModusWcCard bordered={true} padding="compact">
      <div slot="title">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Payment information"
        />
      </div>

      <div className="flex flex-col gap-4 px-1 pb-1 pt-2">
        <ModusWcTextInput
          inputId="dealerPo"
          label="Dealer PO Number"
          placeholder="e.g. PO-998234-2026"
          required
          size="sm"
          value={dealerPoNumber}
          feedback={
            dealerPoError
              ? { level: 'error', message: dealerPoError }
              : undefined
          }
          onInputChange={(e: CustomEvent) =>
            onDealerPoNumberChange(readInputString(e))
          }
        />

        <dl className="payment-info-grid">
          <InfoField label="Payment method" value={billing.paymentMethod} />
          <InfoField label="Payment terms" value={billing.paymentTerms} />
          <InfoField label="Billing account" value={billing.billingAccount} />
          <InfoField
            label="Billing address"
            value={formatBillingAddress(billing)}
          />
        </dl>

        {requireBillingContact && onBillingContactChange ? (
          <ModusWcTextInput
            label="Billing Contact"
            placeholder="Name and phone / email for billing"
            required
            value={billingContact}
            feedback={
              billingError
                ? { level: 'error', message: billingError }
                : undefined
            }
            onInputChange={(e: CustomEvent) =>
              onBillingContactChange(readInputString(e))
            }
          />
        ) : null}
      </div>
    </ModusWcCard>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <ModusWcTypography
        hierarchy="p"
        size="xs"
        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
        label={label}
      />
      <ModusWcTypography hierarchy="p" size="sm" weight="semibold" label={value} />
    </div>
  );
}
