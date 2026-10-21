/** Category of a saved ship-to location. */
export type AddressCategory =
  | 'dealership_branch_warehouse'
  | 'customer_drop_ship';

/**
 * Saved dealership warehouses / ship-to destinations for B2B checkout.
 * `Address` is the canonical name used by edit-location flows.
 */
export interface Address {
  id: string;
  nickname: string;
  category: AddressCategory;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  /** Optional second address line (suite, unit, etc.). */
  streetLine2?: string;
}

/** @deprecated Prefer `Address`. Alias retained for existing checkout imports. */
export type ShippingAddress = Address;

/** Carrier account options available to the dealer. */
export interface ShippingOption {
  id: string;
  carrier: string;
  accountNumber: string;
  /** Short label for selects / compact rows. */
  shortLabel: string;
}

export interface BillingAccount {
  paymentMethod: string;
  billingAccount: string;
  paymentTerms: string;
  company: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
}

export const SHIPPING_ADDRESSES: Address[] = [
  {
    id: 'ca-warehouse',
    nickname: 'California Warehouse',
    category: 'dealership_branch_warehouse',
    street: '1234 Construction Ave.',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '97201',
    country: 'US',
    phone: '(415) 555-0123',
  },
  {
    id: 'tx-yard',
    nickname: 'Texas Warehouse',
    category: 'dealership_branch_warehouse',
    street: '8800 Maple Dr.',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'US',
    phone: '(512) 555-0198',
  },
  {
    id: 'co-depot',
    nickname: 'Colorado Main Warehouse',
    category: 'dealership_branch_warehouse',
    street: '4100 Noble St.',
    city: 'Denver',
    state: 'CO',
    postalCode: '80202',
    country: 'US',
    phone: '(303) 555-0144',
  },
];

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'fedex-corp',
    carrier: 'FedEx Corporate Freight (Standard Ground Layout)',
    accountNumber: 'TRM-FEDX-993812',
    shortLabel: 'FedEx Corporate Freight',
  },
  {
    id: 'ups-freight',
    carrier: 'UPS Freight (Dealer Account)',
    accountNumber: 'TRM-UPS-441208',
    shortLabel: 'UPS Freight',
  },
  {
    id: 'trimble-ltl',
    carrier: 'Trimble Coordinated LTL',
    accountNumber: 'TRM-LTL-220015',
    shortLabel: 'Trimble Coordinated LTL',
  },
];

export const BILLING_ACCOUNT: BillingAccount = {
  paymentMethod: 'Corporate Account Invoice Reference',
  billingAccount: 'Trimble Civil-Corp #98344',
  paymentTerms: 'Net 30 days',
  company: 'Trimble Enterprise Solutions',
  line1: '935 Stewart Dr',
  city: 'Sunnyvale',
  state: 'CA',
  postalCode: '94085',
};

export const DEFAULT_ADDRESS_ID = SHIPPING_ADDRESSES[0].id;
export const DEFAULT_SHIPPING_OPTION_ID = SHIPPING_OPTIONS[0].id;

/** Prototype sales order number assigned after Place order. */
export const DEMO_SALES_ORDER_NUMBER = 'TRM-2026-666654';

export function formatAddressLine(address: Address): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`;
}

export function formatBillingAddress(billing: BillingAccount): string {
  return `${billing.company}, ${billing.line1}, ${billing.city}, ${billing.state} ${billing.postalCode}`;
}

export function getAddressById(id: string): Address | undefined {
  return SHIPPING_ADDRESSES.find((a) => a.id === id);
}

export function getShippingOptionById(id: string): ShippingOption | undefined {
  return SHIPPING_OPTIONS.find((o) => o.id === id);
}

/** Split carrier label into primary line + optional service level in parentheses. */
export function formatCarrierDisplay(option: ShippingOption): {
  title: string;
  subtitle?: string;
} {
  const match = option.carrier.match(/^(.+?)\s*(\([^)]+\))\s*$/);
  if (match) {
    return { title: match[1].trim(), subtitle: match[2] };
  }
  return { title: option.shortLabel };
}
