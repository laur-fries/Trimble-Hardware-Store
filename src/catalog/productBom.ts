import { resolveBomStock } from '../cart/bomHelpers';
import {
  catalogProducts,
  parsePrice,
  type BomItem as CatalogBomItem,
  type CatalogProduct,
  type StockStatus,
} from '../catalogData';
import type { BomComponent } from '../types/product';

export type UniversalBomRow = Omit<BomComponent, 'children'> & {
  imageUrl: string;
  description: string;
  stock: StockStatus;
  children?: UniversalBomRow[];
};

function catalogSkuForPn(pn: string): CatalogProduct | undefined {
  return catalogProducts.find(
    (p) => p.partNumber === pn && !p.isDiscontinued
  );
}

function inferOrderable(item: CatalogBomItem): boolean {
  if (item.isOrderable === true) return true;
  if (item.isOrderable === false) return false;
  const target = item.standalonePn ?? item.pn;
  return Boolean(catalogSkuForPn(target));
}

function mapCatalogBomItem(
  item: CatalogBomItem,
  parent: CatalogProduct
): UniversalBomRow {
  const orderable = inferOrderable(item);
  const standaloneProduct = orderable
    ? catalogSkuForPn(item.standalonePn ?? item.pn)
    : undefined;
  const standalonePrice =
    standaloneProduct != null ? parsePrice(standaloneProduct.price) : undefined;
  const catalogMatch = catalogSkuForPn(item.pn);
  const children = (item.children ?? [])
    .filter((child) => child.pn !== parent.partNumber)
    .map((child) => mapCatalogBomItem(child, parent));
  return {
    pn: item.pn,
    title: item.name,
    qtyPerPackage: Math.max(1, item.qty),
    imageUrl: item.image || catalogMatch?.image || parent.image,
    description:
      item.description ||
      (catalogMatch ? shortDescription(catalogMatch.description) : ''),
    stock: resolveBomStock(item.pn, item.stock),
    isOrderable: orderable,
    standalonePn: item.standalonePn ?? (orderable ? item.pn : undefined),
    standalonePrice,
    note:
      item.note ??
      item.description ??
      (orderable ? 'Orderable replacement accessory' : 'Included in box'),
    ...(children.length > 0 ? { children } : {}),
  };
}

type InboxTemplateLine =
  | { suffix: string; title: string; description: string; qty: number }
  /** Orderable replacement accessory backed by a real catalog SKU. */
  | { sparePn: string; qty: number };

const QUICK_START: InboxTemplateLine = {
  suffix: 'QSG',
  title: 'Quick start guide',
  description: 'Printed setup and safety instructions',
  qty: 1,
};

const INSTALL_GUIDE: InboxTemplateLine = {
  suffix: 'IG',
  title: 'Installation guide',
  description: 'Printed mounting and wiring instructions',
  qty: 1,
};

/** Standard factory box contents by primary product-type facet. */
const INBOX_TEMPLATES: Record<string, InboxTemplateLine[]> = {
  'GNSS Receivers & Smart Antennas': [
    { suffix: 'PSU', title: 'AC power adapter', description: 'Universal 100–240 V wall charger', qty: 1 },
    { suffix: 'USB', title: 'USB-C data cable', description: 'Data transfer and firmware updates', qty: 1 },
    { sparePn: '58957-10', qty: 1 },
    QUICK_START,
  ],
  'Total Stations & Scanners': [
    { suffix: 'BAT', title: 'Rechargeable Li-ion battery', description: 'Internal hot-swap power cell', qty: 2 },
    { suffix: 'CHG', title: 'Battery charger', description: 'Dual-bay desktop charger', qty: 1 },
    { suffix: 'CASE', title: 'Hard transport case', description: 'Foam-fitted instrument case', qty: 1 },
    { sparePn: 'PM200-00', qty: 1 },
    QUICK_START,
  ],
  'Controllers & Data Collectors': [
    { suffix: 'STR', title: 'Hand strap', description: 'Adjustable rear grip strap', qty: 1 },
    { suffix: 'STY', title: 'Tethered stylus', description: 'Capacitive stylus with lanyard', qty: 1 },
    { sparePn: 'PM200-00', qty: 1 },
    QUICK_START,
  ],
  'On-Machine Radios & Gateways': [
    { suffix: 'ANT', title: 'Whip antenna', description: 'UHF antenna for correction broadcast', qty: 1 },
    { suffix: 'MNT', title: 'Mounting bracket hardware', description: 'Vibration-rated machine mount', qty: 1 },
    { sparePn: 'SECO-CBL-05', qty: 1 },
    QUICK_START,
  ],
  'Accessories (Power, Brackets, Cases)': [
    { suffix: 'HW', title: 'Mounting hardware pack', description: 'Bolts, washers, and brackets', qty: 1 },
    { sparePn: '58957-10', qty: 1 },
    INSTALL_GUIDE,
  ],
  'Cables & Harnesses': [
    { suffix: 'TIE', title: 'Cable ties', description: 'UV-resistant routing ties', qty: 4 },
    { sparePn: 'SECO-CBL-05', qty: 1 },
    INSTALL_GUIDE,
  ],
};

const DEFAULT_INBOX: InboxTemplateLine[] = [
  QUICK_START,
  {
    suffix: 'WTY',
    title: 'Warranty card',
    description: 'Registration and coverage details',
    qty: 1,
  },
];

/** First sentence of a catalog description, for one-line BOM sub-descriptions. */
function shortDescription(text: string): string {
  const first = text.split(/(?<=\.)\s/)[0] ?? text;
  return first.replace(/\.$/, '');
}

function standardInboxContents(product: CatalogProduct): UniversalBomRow[] {
  const productType = product.facets['product-type']?.[0] ?? '';
  const template = INBOX_TEMPLATES[productType] ?? DEFAULT_INBOX;
  return template.flatMap((line): UniversalBomRow[] => {
    if ('sparePn' in line) {
      const spare = catalogSkuForPn(line.sparePn);
      if (!spare || spare.partNumber === product.partNumber) return [];
      return [
        {
          pn: spare.partNumber,
          title: spare.name,
          qtyPerPackage: line.qty,
          imageUrl: spare.image,
          description: shortDescription(spare.description),
          stock: spare.stock,
          isOrderable: true,
          standalonePn: spare.partNumber,
          standalonePrice: parsePrice(spare.price),
          note: 'Orderable replacement accessory',
        },
      ];
    }
    return [
      {
        pn: `${product.partNumber}-${line.suffix}`,
        title: line.title,
        qtyPerPackage: line.qty,
        imageUrl: product.image,
        description: line.description,
        stock: product.stock,
        isOrderable: false,
        note: 'Factory component',
      },
    ];
  });
}

/**
 * Single-item bypass: a catalog BOM whose only row is the parent SKU itself
 * is redundant, so the product is treated as having no BOM at all.
 */
function isSelfOnlyBom(product: CatalogProduct): boolean {
  const bom = product.bom ?? [];
  return bom.length === 1 && bom[0].pn === product.partNumber;
}

/**
 * BOM rows for PDP, catalog, and cart: kit components (with nested
 * sub-assemblies) when the catalog defines them, otherwise the standard inbox
 * contents. Never includes the parent SKU itself at any depth.
 */
export function getUniversalProductBom(
  product: CatalogProduct
): UniversalBomRow[] {
  if (isSelfOnlyBom(product)) return [];
  const raw = (product.bom ?? []).filter(
    (item) => item.pn !== product.partNumber
  );
  if (raw.length > 0) {
    return raw.map((item) => mapCatalogBomItem(item, product));
  }
  return standardInboxContents(product);
}

/** True when the product should show BOM UI (catalog "View BOM", PDP section, cart accordion). */
export function hasDisplayableBom(product: CatalogProduct): boolean {
  return getUniversalProductBom(product).length > 0;
}

/** Days from today until a backordered kit part is expected to ship (prototype). */
export const KIT_BACKORDER_LEAD_DAYS = 14;

const STOCK_SEVERITY: Record<StockStatus, number> = {
  'in-stock': 0,
  limited: 1,
  'out-of-stock': 2,
};

/** Worst stock status across a kit's parts — the kit ships when its last part does. */
export function getKitStockRollup(rows: { stock: StockStatus }[]): StockStatus {
  return rows.reduce<StockStatus>(
    (worst, row) =>
      STOCK_SEVERITY[row.stock] > STOCK_SEVERITY[worst] ? row.stock : worst,
    'in-stock'
  );
}

/** e.g. "Oct 12" */
export function kitBackorderShipDateLabel(from: Date = new Date()): string {
  const ship = new Date(from);
  ship.setDate(ship.getDate() + KIT_BACKORDER_LEAD_DAYS);
  return ship.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function resolveStandaloneProduct(
  row: UniversalBomRow
): CatalogProduct | undefined {
  const pn = row.standalonePn ?? row.pn;
  return catalogSkuForPn(pn);
}

export const BOM_SECTION_DOM_ID = 'bom-section';

export function productBomDeepLink(product: Pick<CatalogProduct, 'partNumber' | 'id'>) {
  const pn = encodeURIComponent(product.partNumber);
  return `/product/${pn}#${BOM_SECTION_DOM_ID}?expandBom=true`;
}
