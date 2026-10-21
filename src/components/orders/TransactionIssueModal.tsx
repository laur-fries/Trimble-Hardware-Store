import { useEffect, useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcModal,
  ModusWcTextInput,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { readInputString } from '../../utils/modusFormEvents';

export const TRANSACTION_ISSUE_MODAL_ID = 'transaction-issue-modal';

const dialog = () =>
  document.getElementById(TRANSACTION_ISSUE_MODAL_ID) as HTMLDialogElement | null;

export const openTransactionIssueModal = () => dialog()?.showModal();
export const closeTransactionIssueModal = () => dialog()?.close();

type TransactionIssueModalProps = {
  salesOrderNumber: string;
  dealerPoNumber?: string;
  onSubmit?: (payload: {
    salesOrderNumber: string;
    dealerPoNumber?: string;
    summary: string;
  }) => void;
};

export default function TransactionIssueModal({
  salesOrderNumber,
  dealerPoNumber = '',
  onSubmit,
}: TransactionIssueModalProps) {
  const [summary, setSummary] = useState('');

  useEffect(() => {
    setSummary(
      `Issue with sales order ${salesOrderNumber}${dealerPoNumber ? ` (PO ${dealerPoNumber})` : ''}: `
    );
  }, [salesOrderNumber, dealerPoNumber]);

  const handleSubmit = () => {
    onSubmit?.({
      salesOrderNumber,
      dealerPoNumber: dealerPoNumber || undefined,
      summary: summary.trim(),
    });
    closeTransactionIssueModal();
  };

  return (
    <ModusWcModal
      modalId={TRANSACTION_ISSUE_MODAL_ID}
      backdrop="default"
      position="center"
      showClose
      aria-label="Report transaction issue"
    >
      <div slot="header">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Report transaction issue"
        />
      </div>

      <div slot="content" className="flex flex-col gap-3">
        <ModusWcTextInput
          size="sm"
          label="Sales order"
          value={salesOrderNumber}
          disabled
          aria-label="Sales order number"
        />
        {dealerPoNumber ? (
          <ModusWcTextInput
            size="sm"
            label="Dealer PO"
            value={dealerPoNumber}
            disabled
            aria-label="Dealer PO number"
          />
        ) : null}
        <ModusWcTextInput
          size="sm"
          label="Issue summary"
          value={summary}
          required
          aria-label="Describe the transaction issue"
          onInputChange={(e: CustomEvent) => setSummary(readInputString(e))}
        />
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Trimble Dealer Support will respond using your TID on file. This prototype does not send email."
        />
      </div>

      <div slot="footer" className="flex w-full justify-end gap-2">
        <ModusWcButton
          color="tertiary"
          variant="outlined"
          size="sm"
          onButtonClick={closeTransactionIssueModal}
        >
          Cancel
        </ModusWcButton>
        <ModusWcButton
          color="primary"
          variant="filled"
          size="sm"
          disabled={!summary.trim()}
          onButtonClick={handleSubmit}
        >
          <ModusWcIcon name="email" size="xs" decorative />
          Submit request
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}
