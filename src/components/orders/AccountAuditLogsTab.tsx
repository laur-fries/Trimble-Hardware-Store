import { ModusWcCard, ModusWcTypography } from '@trimble-oss/moduswebcomponents-react';
import type { AccountAuditLogRow } from '../../orders/accountAuditLogsData';

type AccountAuditLogsTabProps = {
  logs: AccountAuditLogRow[];
};

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

export default function AccountAuditLogsTab({ logs }: AccountAuditLogsTabProps) {
  if (logs.length === 0) {
    return (
      <ModusWcCard bordered={true} padding="comfortable">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="No audit entries match your search"
        />
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Account activity is retained for up to four years."
        />
      </ModusWcCard>
    );
  }

  return (
    <ul className="account-audit-list" aria-label="Account audit log">
      {logs.map((row) => (
        <li key={row.id} className="account-audit-list-item">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label={row.action}
          />
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={`${formatWhen(row.timestamp)} · ${row.tid} · IP ${row.ipAddress} · ${row.location}`}
          />
        </li>
      ))}
    </ul>
  );
}
