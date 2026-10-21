import { catalogProducts, parsePrice } from '../catalogData';
import { enrichLineItems } from './lineItemHelpers';
import type {
  LineItem,
  OrderAddress,
  OrderShipment,
  PlacedOrder,
} from './types';

const AUSTIN_SHIP: OrderAddress = {
  label: 'Austin Regional Warehouse',
  lines: ['4100 Trimble Way', 'Austin, TX 78728', 'United States'],
};

const AUSTIN_BILL: OrderAddress = {
  label: 'Southwest Dealer Billing',
  lines: ['PO Box 2201', 'Austin, TX 78767', 'United States'],
};

const SUNNYVALE_SHIP: OrderAddress = {
  label: 'Sunnyvale HQ Warehouse',
  lines: ['935 Stewart Drive', 'Sunnyvale, CA 94085', 'United States'],
};

const DENVER_SHIP: OrderAddress = {
  label: 'Denver Main Warehouse',
  lines: ['4100 Heavy Equipment Blvd', 'Denver, CO 80216', 'United States'],
};

const TEXAS_SHIP: OrderAddress = {
  label: 'Texas Warehouse',
  lines: ['8800 Trimble Way', 'Austin, TX 78758', 'United States'],
};

const CALIFORNIA_SHIP: OrderAddress = {
  label: 'California Warehouse',
  lines: ['1234 Construction Ave.', 'San Francisco, CA 97201', 'United States'],
};

export const SPECIAL_SHIPPING_REVIEW_INSTRUCTIONS =
  'Deliver via lift-gate truck to side gate on Construction Ave. Contact site supervisor 1 hour prior to delivery.';

function flattenShipmentItems(shipments: OrderShipment[]): LineItem[] {
  return enrichLineItems(shipments.flatMap((shipment) => shipment.items));
}

function withShipments(
  order: Omit<PlacedOrder, 'items' | 'shipments'> & {
    shipments: OrderShipment[];
  }
): PlacedOrder {
  const items = flattenShipmentItems(order.shipments);
  return {
    ...order,
    items,
    shipments: order.shipments.map((shipment) => ({
      ...shipment,
      items: enrichLineItems(shipment.items),
    })),
  };
}

/** Generate a large B2B order (~100+ lines) by cycling catalog SKUs. */
function buildLargeFleetOrder(): PlacedOrder {
  const target = 102;
  const items: LineItem[] = Array.from({ length: target }, (_, i) => {
    const product = catalogProducts[i % catalogProducts.length];
    const lot = Math.floor(i / catalogProducts.length) + 1;
    return {
      partNumber: product.partNumber,
      title: lot > 1 ? `${product.name} (Wave ${lot})` : product.name,
      quantity: (i % 3) + 1,
      unitPrice: parsePrice(product.price),
      image: product.image,
    };
  });

  const enriched = enrichLineItems(items);
  const mid = Math.ceil(enriched.length / 2);
  const wave1 = enriched.slice(0, mid);
  const wave2 = enriched.slice(mid);
  const total = enriched.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return withShipments({
    id: 'TRM-2026-110482',
    placedDate: '2026-08-01T14:10:00.000Z',
    total: Math.round(total * 100) / 100,
    shipTo: `${AUSTIN_SHIP.label} + ${TEXAS_SHIP.label}`,
    carrier: 'Multi-carrier',
    dealerPo: 'PO-FLEET-2026-088',
    status: 'Processing',
    shippingAddress: AUSTIN_SHIP,
    billingAddress: AUSTIN_BILL,
    shipments: [
      {
        id: 'fleet-ship-1',
        methodLabel: 'Trimble Logistics (LTL)',
        status: 'Processing',
        statusDetail: 'Est. Aug 25, 2026 — staging for pickup',
        carrier: 'Trimble Logistics (LTL)',
        trackingNumber: 'Pending assignment',
        shipTo: AUSTIN_SHIP,
        items: wave1,
      },
      {
        id: 'fleet-ship-2',
        methodLabel: 'UPS Freight',
        status: 'Processing',
        statusDetail: 'Est. Aug 28, 2026 — awaiting packout',
        carrier: 'UPS Freight (Dealer Account)',
        trackingNumber: 'Pending assignment',
        shipTo: TEXAS_SHIP,
        items: wave2,
      },
    ],
  });
}

/**
 * Seed history so Placed Orders is populated on first visit. The first page
 * covers all five invoice states (Proforma, Open, Paid, Overdue, Cancelled)
 * for usability testing; due dates assume Net 30 from the order date.
 */
export const SEED_PLACED_ORDERS: PlacedOrder[] = [
  {
    id: 'TRM-2026-104702',
    placedDate: '2026-10-19T16:20:00.000Z',
    total: 2640,
    shipTo: AUSTIN_SHIP.label,
    carrier: 'UPS Ground',
    dealerPo: 'PO-AUS-5141',
    status: 'Submitted',
    createdByTid: 'jordan.rivera@trimble.com',
    shippingAddress: AUSTIN_SHIP,
    billingAddress: AUSTIN_BILL,
    items: enrichLineItems([
      {
        partNumber: '01001-00',
        title: 'Trimble TDL 450 Radio Module',
        quantity: 1,
        unitPrice: 2640,
      },
    ]),
  },
  withShipments({
    id: 'TRM-2026-104455',
    placedDate: '2026-10-16T17:00:00.000Z',
    total: 9750,
    shipTo: TEXAS_SHIP.label,
    carrier: 'FedEx Ground',
    dealerPo: 'PO-TEX-5120',
    status: 'Delivered',
    invoiceStatus: 'Open',
    createdByTid: 'jordan.rivera@trimble.com',
    shippedAt: '2026-10-16T22:00:00.000Z',
    actualDeliveryDate: '2026-10-18T18:30:00.000Z',
    shippingAddress: TEXAS_SHIP,
    billingAddress: AUSTIN_BILL,
    shipments: [
      {
        id: '104455-ship-1',
        methodLabel: 'FedEx Ground',
        status: 'Delivered',
        statusDetail: 'Delivered Oct 18, 2026',
        carrier: 'FedEx Ground',
        trackingNumber: '794698765432',
        shipTo: TEXAS_SHIP,
        items: [
          {
            partNumber: 'CB460-00',
            title: 'Trimble CB460 Grade Control Display',
            quantity: 1,
            unitPrice: 9750,
          },
        ],
      },
    ],
  }),
  {
    id: 'TRM-2026-103870',
    placedDate: '2026-09-30T17:00:00.000Z',
    total: 14840,
    shipTo: AUSTIN_SHIP.label,
    carrier: 'UPS Ground',
    dealerPo: 'PO-44201-VOID',
    status: 'Cancelled',
    invoiceStatus: 'Cancelled',
    createdByTid: 'procurement@dealership.com',
    shippingAddress: AUSTIN_SHIP,
    billingAddress: AUSTIN_BILL,
    items: enrichLineItems([
      {
        partNumber: '121760-00',
        title: 'Trimble TSC7 Field Controller',
        quantity: 2,
        unitPrice: 7420,
      },
    ]),
  },
  {
    id: 'TRM-2026-666654',
    placedDate: '2026-09-24T08:44:00.000Z',
    total: 20212.5,
    shipTo: CALIFORNIA_SHIP.label,
    carrier: 'Multi-carrier (Pending Review)',
    dealerPo: 'PO-44192-SPECIAL',
    status: 'On Hold',
    holdType: 'SHIPPING',
    createdByTid: 'dealer.ops@trimblehardware.demo',
    hasSpecialInstructions: true,
    specialInstructionsText: SPECIAL_SHIPPING_REVIEW_INSTRUCTIONS,
    shippingAddress: CALIFORNIA_SHIP,
    billingAddress: AUSTIN_BILL,
    items: enrichLineItems([
      {
        partNumber: '82758-00',
        title: 'Trimble R780 GNSS Receiver',
        quantity: 1,
        unitPrice: 18950,
      },
      {
        partNumber: '58957-10',
        title: 'Power Cable',
        quantity: 1,
        unitPrice: 1262.5,
      },
    ]),
  },
  withShipments({
    id: 'TRM-2026-103102',
    placedDate: '2026-09-07T17:00:00.000Z',
    total: 37900,
    shipTo: CALIFORNIA_SHIP.label,
    carrier: 'UPS Freight',
    dealerPo: 'PO-CAL-5088',
    status: 'Delivered',
    invoiceStatus: 'Overdue',
    createdByTid: 'dealer.ops@trimblehardware.demo',
    shippedAt: '2026-09-08T16:00:00.000Z',
    actualDeliveryDate: '2026-09-11T19:00:00.000Z',
    shippingAddress: CALIFORNIA_SHIP,
    billingAddress: AUSTIN_BILL,
    shipments: [
      {
        id: '103102-ship-1',
        methodLabel: 'LTL Palletized Freight',
        status: 'Delivered',
        statusDetail: 'Delivered Sep 11, 2026',
        carrier: 'UPS Freight',
        trackingNumber: '1Z8888888888888888',
        shipTo: CALIFORNIA_SHIP,
        items: [
          {
            partNumber: '82758-00',
            title: 'Trimble R780 GNSS Receiver',
            quantity: 2,
            unitPrice: 18950,
          },
        ],
      },
    ],
  }),
  withShipments({
    id: 'TRM-2026-102938',
    placedDate: '2026-07-28T15:42:00.000Z',
    total: 54760,
    shipTo: DENVER_SHIP.label,
    carrier: 'Multi-carrier',
    dealerPo: 'PO-44192-A',
    status: 'Shipped',
    invoiceStatus: 'Paid',
    shippingAddress: DENVER_SHIP,
    billingAddress: AUSTIN_BILL,
    shipments: [
      {
        id: '102938-ship-1',
        methodLabel: 'LTL Palletized Freight',
        status: 'Delivered',
        statusDetail: 'Delivered Aug 2, 2026',
        carrier: 'UPS Freight',
        trackingNumber: '1Z9999999999999999',
        shipTo: DENVER_SHIP,
        items: [
          {
            partNumber: '82758-00',
            title: 'Trimble R780 GNSS Receiver',
            quantity: 2,
            unitPrice: 18950,
          },
          {
            partNumber: '121760-00',
            title: 'Trimble TSC7 Field Controller',
            quantity: 2,
            unitPrice: 7420,
          },
        ],
      },
      {
        id: '102938-ship-2',
        methodLabel: 'FedEx Ground Collect',
        status: 'In Transit',
        statusDetail: 'In Transit – Est. Aug 12, 2026',
        carrier: 'FedEx Ground',
        trackingNumber: '781234567890',
        shipTo: DENVER_SHIP,
        items: [
          {
            partNumber: '58957-10',
            title: 'Power Cable',
            quantity: 2,
            unitPrice: 310,
            note: 'Backordered item shipped separately',
          },
        ],
      },
    ],
  }),
  buildLargeFleetOrder(),
  withShipments({
    id: 'TRM-2026-099441',
    placedDate: '2026-08-05T09:20:00.000Z',
    total: 12390,
    shipTo: `${DENVER_SHIP.label} + ${TEXAS_SHIP.label}`,
    carrier: 'Multi-carrier',
    dealerPo: 'PO-DEN-3301',
    status: 'Processing',
    createdByTid: 'user@dealership.com',
    shippingAddress: DENVER_SHIP,
    billingAddress: AUSTIN_BILL,
    shipments: [
      {
        id: '099441-ship-1',
        methodLabel: 'Trimble Logistics',
        status: 'Processing',
        statusDetail: 'Packout in progress',
        carrier: 'Trimble Logistics',
        trackingNumber: 'Pending assignment',
        shipTo: DENVER_SHIP,
        items: [
          {
            partNumber: 'CB460-00',
            title: 'Trimble CB460 Grade Control Display',
            quantity: 1,
            unitPrice: 9750,
          },
        ],
      },
      {
        id: '099441-ship-2',
        methodLabel: 'UPS Freight',
        status: 'Processing',
        statusDetail: 'Awaiting carrier pickup',
        carrier: 'UPS Freight (Dealer Account)',
        trackingNumber: 'Pending assignment',
        shipTo: TEXAS_SHIP,
        items: [
          {
            partNumber: '01001-00',
            title: 'Trimble TDL 450 Radio Module',
            quantity: 1,
            unitPrice: 2640,
          },
        ],
      },
    ],
  }),
  {
    id: 'TRM-2026-098220',
    placedDate: '2026-08-01T16:55:00.000Z',
    total: 2640,
    shipTo: AUSTIN_SHIP.label,
    carrier: 'UPS Freight (Dealer Account)',
    dealerPo: 'PO-44188-H',
    status: 'On Hold',
    holdType: 'CREDIT',
    createdByTid: 'credit.ops@dealership.com',
    submitterIp: '198.51.100.22',
    shippingAddress: AUSTIN_SHIP,
    billingAddress: AUSTIN_BILL,
    items: enrichLineItems([
      {
        partNumber: '01001-00',
        title: 'Trimble TDL 450 Radio Module',
        quantity: 1,
        unitPrice: 2640,
      },
    ]),
  },
  {
    id: 'TRM-2026-097015',
    placedDate: '2026-08-10T10:30:00.000Z',
    total: 24300,
    shipTo: DENVER_SHIP.label,
    carrier: 'FedEx International Priority',
    dealerPo: 'PO-EXPORT-7712',
    status: 'On Hold',
    holdType: 'EEUC',
    eeucRequired: true,
    createdByTid: 'export.desk@dealership.com',
    shippingAddress: DENVER_SHIP,
    billingAddress: AUSTIN_BILL,
    items: enrichLineItems([
      {
        partNumber: '113600-20',
        title: 'Trimble S7 Total Station (Legacy)',
        quantity: 1,
        unitPrice: 24300,
      },
    ]),
  },
  {
    id: 'TRM-2022-040012',
    placedDate: '2022-04-18T13:00:00.000Z',
    total: 7420,
    shipTo: SUNNYVALE_SHIP.label,
    carrier: 'FedEx Ground',
    dealerPo: 'PO-ARCH-2019',
    status: 'Delivered',
    invoiceStatus: 'Paid',
    actualDeliveryDate: '2022-04-22T18:00:00.000Z',
    createdByTid: 'legacy.buyer@dealership.com',
    shippingAddress: SUNNYVALE_SHIP,
    billingAddress: AUSTIN_BILL,
    items: enrichLineItems([
      {
        partNumber: '121760-00',
        title: 'Trimble TSC7 Field Controller',
        quantity: 1,
        unitPrice: 7420,
      },
    ]),
  },
  withShipments({
    id: 'TRM-2026-101104',
    placedDate: '2026-07-12T11:08:00.000Z',
    total: 1180,
    shipTo: SUNNYVALE_SHIP.label,
    carrier: 'FedEx Ground',
    dealerPo: 'PO-SVL-7781',
    status: 'Delivered',
    invoiceStatus: 'Paid',
    actualDeliveryDate: '2026-07-16T09:00:00.000Z',
    createdByTid: 'user@dealership.com',
    shippingAddress: SUNNYVALE_SHIP,
    billingAddress: {
      label: 'West Coast Dealer Billing',
      lines: ['935 Stewart Drive', 'Sunnyvale, CA 94085', 'United States'],
    },
    shipments: [
      {
        id: '101104-ship-1',
        methodLabel: 'FedEx Ground',
        status: 'Delivered',
        statusDetail: 'Delivered Jul 16, 2026',
        carrier: 'FedEx Ground',
        trackingNumber: '794612345678',
        shipTo: SUNNYVALE_SHIP,
        items: [
          {
            partNumber: '92600-00',
            title: 'Trimble External Power Kit',
            quantity: 1,
            unitPrice: 1180,
          },
        ],
      },
    ],
  }),
  ...buildOrderHistory(),
];

/**
 * Deterministic delivered-order history spread across the five-year
 * retention window so the placed orders table has realistic volume.
 */
function buildOrderHistory(): PlacedOrder[] {
  const count = 30;
  const products = catalogProducts.filter((p) => !p.isDiscontinued);
  const destinations = [SUNNYVALE_SHIP, DENVER_SHIP, TEXAS_SHIP, CALIFORNIA_SHIP, AUSTIN_SHIP];
  const carriers = ['FedEx Ground', 'UPS Ground', 'Trimble Logistics (LTL)', 'FedEx Freight'];
  const buyers = [
    'dealer.ops@trimblehardware.demo',
    'jordan.rivera@trimble.com',
    'procurement@dealership.com',
  ];
  const start = Date.parse('2026-06-20T15:00:00.000Z');
  const dayMs = 24 * 60 * 60 * 1000;

  return Array.from({ length: count }, (_, i) => {
    const placed = new Date(start - i * 56 * dayMs);
    const lineCount = (i % 5) + 1;
    const items = enrichLineItems(
      Array.from({ length: lineCount }, (_, j) => {
        const product = products[(i * 3 + j * 7) % products.length];
        return {
          partNumber: product.partNumber,
          title: product.name,
          quantity: ((i + j) % 4) + 1,
          unitPrice: parsePrice(product.price),
          image: product.image,
        };
      })
    );
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const destination = destinations[i % destinations.length];
    const year = placed.getUTCFullYear();
    const delivered = new Date(placed.getTime() + 5 * dayMs);

    return {
      id: `TRM-${year}-${String(90000 - i * 1873).padStart(6, '0')}`,
      placedDate: placed.toISOString(),
      total: Math.round(total * 100) / 100,
      shipTo: destination.label,
      carrier: carriers[i % carriers.length],
      dealerPo: `PO-${destination.label.slice(0, 3).toUpperCase()}-${4100 + i * 37}`,
      status: 'Delivered',
      invoiceStatus: 'Paid',
      createdByTid: buyers[i % buyers.length],
      shippedAt: new Date(placed.getTime() + dayMs).toISOString(),
      actualDeliveryDate: delivered.toISOString(),
      shippingAddress: destination,
      billingAddress: AUSTIN_BILL,
      items,
    } satisfies PlacedOrder;
  });
}
