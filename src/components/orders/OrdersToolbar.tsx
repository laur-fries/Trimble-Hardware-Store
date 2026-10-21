import {
  ModusWcSelect,
  ModusWcTextInput,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { ISelectOption } from '@trimble-oss/moduswebcomponents';
import {
  DEFAULT_ORDER_FILTERS,
  type OrderCarrierFilter,
  type OrderListFilters,
  type OrderStatusFilter,
  type OrderTimeframeFilter,
} from '../../orders/orderFilters';
import { readInputString } from '../../utils/modusFormEvents';

const STATUS_OPTIONS: ISelectOption[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Order submitted', value: 'submitted' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'On hold', value: 'on_hold' },
  { label: 'In transit', value: 'in_transit' },
];

const TIMEFRAME_OPTIONS: ISelectOption[] = [
  { label: 'Last 30 days', value: '30d' },
  { label: 'Past 6 months', value: '6m' },
  { label: 'Past 1 year', value: '1y' },
  { label: 'Past 5 years', value: '5y' },
];

const CARRIER_OPTIONS: ISelectOption[] = [
  { label: 'All carriers', value: 'all' },
  { label: 'FedEx', value: 'fedex' },
  { label: 'UPS', value: 'ups' },
  { label: 'Freight', value: 'freight' },
];

type OrdersToolbarProps = {
  filters: OrderListFilters;
  onChange: (next: OrderListFilters) => void;
};

export default function OrdersToolbar({
  filters,
  onChange,
}: OrdersToolbarProps) {
  const patch = (partial: Partial<OrderListFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <section
      className="orders-toolbar mb-4 flex flex-col gap-3"
      aria-label="Search and filter orders"
    >
      <ModusWcTextInput
        size="sm"
        includeSearch
        includeClear
        value={filters.query}
        label="Search orders"
        placeholder="Search by Sales Order (SO#), Dealer PO#, or Part Number (PN)..."
        aria-label="Search by sales order, dealer PO, or part number"
        onInputChange={(e: CustomEvent) =>
          patch({ query: readInputString(e) })
        }
      />

      <div className="orders-toolbar-filters grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ModusWcSelect
          size="sm"
          label="Status"
          aria-label="Filter by order status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onInputChange={(e: CustomEvent) =>
            patch({ status: readInputString(e) as OrderStatusFilter })
          }
        />
        <ModusWcSelect
          size="sm"
          label="Timeframe"
          aria-label="Filter by timeframe"
          value={filters.timeframe}
          options={TIMEFRAME_OPTIONS}
          onInputChange={(e: CustomEvent) =>
            patch({
              timeframe: readInputString(e) as OrderTimeframeFilter,
            })
          }
        />
        <ModusWcSelect
          size="sm"
          label="Carrier"
          aria-label="Filter by carrier"
          value={filters.carrier}
          options={CARRIER_OPTIONS}
          onInputChange={(e: CustomEvent) =>
            patch({ carrier: readInputString(e) as OrderCarrierFilter })
          }
        />
      </div>

      <ModusWcTypography
        hierarchy="p"
        size="xs"
        customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
        label="Filters apply to placed orders and pending discount requests. Order history is retained for five years."
      />
    </section>
  );
}

export { DEFAULT_ORDER_FILTERS };
