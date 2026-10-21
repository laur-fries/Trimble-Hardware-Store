import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd } from '../../cart/CartContext';
import { invoiceStateBadge } from '../../orders/invoicePresentation';
import type { InvoiceDocumentRow } from '../../orders/invoiceDocuments';

type InvoicesTabProps = {
  documents: InvoiceDocumentRow[];
  onDownload: (doc: InvoiceDocumentRow) => void;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export default function InvoicesTab({ documents, onDownload }: InvoicesTabProps) {
  if (documents.length === 0) {
    return (
      <ModusWcCard bordered={true} padding="comfortable">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="No invoices match your search"
        />
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Proforma and tax invoices appear here after you place orders."
        />
      </ModusWcCard>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Invoices and proformas">
      {documents.map((doc) => {
        const badge = doc.invoiceStatus
          ? invoiceStateBadge(doc.invoiceStatus, doc.placedTimestamp)
          : null;
        return (
          <li key={doc.id}>
            <ModusWcCard bordered={true} padding="compact">
              <div className="invoice-doc-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ModusWcTypography
                      hierarchy="p"
                      size="md"
                      weight="semibold"
                      customClass="font-mono"
                      label={doc.salesOrderNumber}
                    />
                    <ModusWcBadge variant="filled" size="sm">
                      {doc.documentType}
                    </ModusWcBadge>
                    {badge ? (
                      <ModusWcBadge
                        variant="filled"
                        color={badge.color}
                        size="sm"
                      >
                        {badge.label}
                      </ModusWcBadge>
                    ) : null}
                  </div>
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                    label={`Dealer PO ${doc.dealerPoNumber} · ${formatWhen(doc.placedTimestamp)} · ${formatUsd(doc.amount)}`}
                  />
                </div>
                <ModusWcButton
                  color="tertiary"
                  variant="outlined"
                  size="sm"
                  aria-label={`Download ${doc.documentType} for ${doc.salesOrderNumber}`}
                  onButtonClick={() => onDownload(doc)}
                >
                  <ModusWcIcon name="download" size="xs" decorative />
                  Download
                </ModusWcButton>
              </div>
            </ModusWcCard>
          </li>
        );
      })}
    </ul>
  );
}
