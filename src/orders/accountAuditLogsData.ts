import type { AuditLogEntry } from '../types/order';

export interface AccountAuditLogRow extends AuditLogEntry {
  id: string;
  relatedSalesOrder?: string;
}

export const SEED_ACCOUNT_AUDIT_LOGS: AccountAuditLogRow[] = [
  {
    id: 'audit-2026-001',
    timestamp: '2026-08-05T09:14:00.000Z',
    tid: 'john.doe@dealer.com',
    ipAddress: '192.168.1.1',
    location: 'Denver, CO, US',
    action: 'Order submitted for TRM-2026-099441',
    relatedSalesOrder: 'TRM-2026-099441',
  },
  {
    id: 'audit-2026-002',
    timestamp: '2026-07-28T15:42:00.000Z',
    tid: 'john.doe@dealer.com',
    ipAddress: '192.168.1.1',
    location: 'Denver, CO, US',
    action: 'Order submitted for TRM-2026-102938',
    relatedSalesOrder: 'TRM-2026-102938',
  },
  {
    id: 'audit-2026-003',
    timestamp: '2026-07-15T11:20:00.000Z',
    tid: 'dealer.ops@trimblehardware.demo',
    ipAddress: '198.51.100.22',
    location: 'Austin, TX, US',
    action: 'Shipping address updated in address book',
  },
  {
    id: 'audit-2025-004',
    timestamp: '2025-11-02T08:45:00.000Z',
    tid: 'dealer.ops@trimblehardware.demo',
    ipAddress: '10.0.0.44',
    location: 'Austin, TX, US',
    action: 'Checkout completed for TRM-2025-881002',
    relatedSalesOrder: 'TRM-2025-881002',
  },
  {
    id: 'audit-2023-005',
    timestamp: '2023-03-18T14:00:00.000Z',
    tid: 'legacy.buyer@dealership.com',
    ipAddress: '172.16.0.8',
    location: 'Sunnyvale, CA, US',
    action: 'Discretionary discount request submitted',
  },
];

const FOUR_YEARS_MS = 4 * 365 * 24 * 60 * 60 * 1000;

export function filterAccountAuditLogs(
  rows: AccountAuditLogRow[],
  query: string
): AccountAuditLogRow[] {
  const cutoff = Date.now() - FOUR_YEARS_MS;
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (new Date(row.timestamp).getTime() < cutoff) return false;
    if (!q) return true;
    return (
      row.action.toLowerCase().includes(q) ||
      row.tid.toLowerCase().includes(q) ||
      row.relatedSalesOrder?.toLowerCase().includes(q) ||
      row.ipAddress.includes(q)
    );
  });
}
