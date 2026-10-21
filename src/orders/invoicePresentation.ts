import type { InvoiceStatus } from '../types/order';

export function invoiceStateBadge(
  status: InvoiceStatus,
  placedTimestamp: string
): { label: string; color: 'success' | 'warning' | 'danger' | 'tertiary' } {
  switch (status) {
    case 'Paid':
      return { label: 'Paid', color: 'success' };
    case 'Overdue':
      return { label: 'Overdue', color: 'danger' };
    case 'Cancelled':
      return { label: 'Cancelled', color: 'tertiary' };
    case 'Open': {
      const due = new Date(placedTimestamp);
      due.setDate(due.getDate() + 30);
      const dueLabel = due.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      return { label: `Open · Due ${dueLabel}`, color: 'warning' };
    }
  }
}
