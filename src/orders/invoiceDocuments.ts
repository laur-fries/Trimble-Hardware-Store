import type { Order, InvoiceStatus } from '../types/order';

export interface InvoiceDocumentRow {
  id: string;
  salesOrderNumber: string;
  dealerPoNumber: string;
  documentType: 'Tax Invoice' | 'Proforma Invoice';
  /** PRD lifecycle status; proforma documents have none. */
  invoiceStatus?: InvoiceStatus;
  placedTimestamp: string;
  amount: number;
}

export function buildInvoiceDocuments(orders: Order[]): InvoiceDocumentRow[] {
  return orders.flatMap<InvoiceDocumentRow>((order) => {
    const base = {
      salesOrderNumber: order.salesOrderNumber,
      dealerPoNumber: order.dealerPoNumber,
      placedTimestamp: order.placedTimestamp,
      amount: order.totalNetPrice,
    };
    if (!order.invoiceStatus) {
      return order.isProformaAvailable
        ? [{ ...base, id: `${order.salesOrderNumber}-proforma`, documentType: 'Proforma Invoice' as const }]
        : [];
    }
    if (order.invoiceStatus === 'Cancelled') return [];
    return [
      {
        ...base,
        id: `${order.salesOrderNumber}-tax`,
        documentType: 'Tax Invoice' as const,
        invoiceStatus: order.invoiceStatus,
      },
    ];
  });
}

export function filterInvoiceDocuments(
  docs: InvoiceDocumentRow[],
  query: string
): InvoiceDocumentRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return docs;
  return docs.filter(
    (doc) =>
      doc.salesOrderNumber.toLowerCase().includes(q) ||
      doc.dealerPoNumber.toLowerCase().includes(q)
  );
}
