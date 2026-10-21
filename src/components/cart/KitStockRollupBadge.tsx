import { ModusWcBadge, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';
import { kitBackorderShipDateLabel } from '../../catalog/productBom';
import type { StockStatus } from '../../catalogData';

/** Parent-level kit availability, rolled up from the worst sub-component status. */
export default function KitStockRollupBadge({ status }: { status: StockStatus }) {
  const meta =
    status === 'out-of-stock'
      ? {
          color: 'warning' as const,
          icon: 'warning',
          label: `Backordered — Ships ${kitBackorderShipDateLabel()}`,
        }
      : status === 'limited'
        ? {
            color: 'warning' as const,
            icon: 'warning',
            label: 'Limited availability',
          }
        : {
            color: 'success' as const,
            icon: 'check_circle',
            label: 'Plenty in stock',
          };

  return (
    <ModusWcBadge variant="text" color={meta.color} size="sm">
      <ModusWcIcon name={meta.icon} size="xs" decorative />
      {meta.label}
    </ModusWcBadge>
  );
}
