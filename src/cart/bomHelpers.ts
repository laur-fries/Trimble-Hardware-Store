import {
  catalogProducts,
  parsePrice,
  type BomItem,
  type CatalogProduct,
  type StockStatus,
} from '../catalogData';

/** Per-sub-component selection state for kit unbundling. */
export interface BomLineSelection {
  selected: boolean;
  quantity: number;
}

/** Minimal cart-line shape used by BOM pricing helpers. */
export interface BomPricedLine {
  product: CatalogProduct;
  quantity: number;
  bomSelection?: Record<string, BomLineSelection>;
}

/** Resolved BOM row ready for cart UI (prices as dollars). */
export interface ResolvedBomComponent {
  pn: string;
  name: string;
  description: string;
  /** Catalog / default kit quantity for this sub-component. */
  defaultQty: number;
  unitPrice: number;
  image: string;
  stock: StockStatus;
}

const stockFallback: StockStatus[] = ['in-stock', 'in-stock', 'limited', 'in-stock', 'out-of-stock'];

/** Deterministic mock stock when the PN is not a standalone catalog SKU. */
export function resolveBomStock(pn: string, override?: StockStatus): StockStatus {
  if (override) return override;
  const match = catalogProducts.find((p) => p.partNumber === pn);
  if (match) return match.stock;
  let hash = 0;
  for (let i = 0; i < pn.length; i += 1) hash = (hash + pn.charCodeAt(i)) % stockFallback.length;
  return stockFallback[hash];
}

function allocateUnitPrices(bom: BomItem[], kitPrice: number): Map<string, number> {
  const prices = new Map<string, number>();
  const allPriced = bom.every((item) => Boolean(item.unitPrice));
  if (allPriced) {
    for (const item of bom) {
      prices.set(item.pn, parsePrice(item.unitPrice!));
    }
    return prices;
  }

  const totalQty = bom.reduce((sum, item) => sum + Math.max(1, item.qty), 0) || 1;
  let remaining = kitPrice;
  bom.forEach((item, index) => {
    const qty = Math.max(1, item.qty);
    if (item.unitPrice) {
      const unit = parsePrice(item.unitPrice);
      prices.set(item.pn, unit);
      remaining -= unit * qty;
      return;
    }
    if (index === bom.length - 1) {
      prices.set(item.pn, Math.max(0, Math.round((remaining / qty) * 100) / 100));
      return;
    }
    const share = (kitPrice * qty) / totalQty;
    const unit = Math.round((share / qty) * 100) / 100;
    prices.set(item.pn, unit);
    remaining -= unit * qty;
  });
  return prices;
}

/** Enrich kit BOM rows with price, image, description, and stock. */
export function resolveBomComponents(product: CatalogProduct): ResolvedBomComponent[] {
  const bom = product.bom ?? [];
  if (bom.length === 0) return [];
  const unitPrices = allocateUnitPrices(bom, parsePrice(product.price));

  return bom.map((item) => {
    const catalogMatch = catalogProducts.find((p) => p.partNumber === item.pn);
    return {
      pn: item.pn,
      name: item.name,
      description:
        item.description ||
        catalogMatch?.description?.split('.')[0] ||
        'Kit sub-component',
      defaultQty: Math.max(1, item.qty),
      unitPrice: unitPrices.get(item.pn) ?? 0,
      image: item.image || catalogMatch?.image || product.image,
      stock: resolveBomStock(item.pn, item.stock),
    };
  });
}

/**
 * Pre-packaged kits ship whole: every part stays in the kit total, and a
 * backordered part delays the kit (see `getKitStockRollup`) instead of being dropped.
 */
export function isBomComponentSelectable(_stock: StockStatus): boolean {
  return true;
}

export function createDefaultBomSelection(
  product: CatalogProduct
): Record<string, BomLineSelection> | undefined {
  const components = resolveBomComponents(product);
  if (!product.isKit || components.length === 0) return undefined;
  return Object.fromEntries(
    components.map((component) => [
      component.pn,
      {
        selected: isBomComponentSelectable(component.stock),
        quantity: component.defaultQty,
      },
    ])
  );
}

/** Force out-of-stock rows to stay unchecked (e.g. after hydrate from storage). */
export function normalizeBomSelection(
  product: CatalogProduct,
  selection: Record<string, BomLineSelection>
): Record<string, BomLineSelection> {
  const components = resolveBomComponents(product);
  if (components.length === 0) return selection;
  const next: Record<string, BomLineSelection> = { ...selection };
  for (const component of components) {
    const row = next[component.pn];
    if (!row) {
      next[component.pn] = {
        selected: isBomComponentSelectable(component.stock),
        quantity: component.defaultQty,
      };
      continue;
    }
    if (!isBomComponentSelectable(component.stock) && row.selected) {
      next[component.pn] = { ...row, selected: false };
    }
  }
  return next;
}

function selectionForLine(
  line: BomPricedLine
): Record<string, BomLineSelection> | undefined {
  const base = line.bomSelection ?? createDefaultBomSelection(line.product);
  if (!base) return undefined;
  return normalizeBomSelection(line.product, base);
}

/** Unit price for one kit (or a simple SKU) after BOM selection. */
export function getLineUnitPrice(line: BomPricedLine): number {
  const bom = line.product.bom ?? [];
  if (!line.product.isKit || bom.length === 0) {
    return parsePrice(line.product.price);
  }

  const components = resolveBomComponents(line.product);
  const selection = selectionForLine(line) ?? {};
  return components.reduce((total, component) => {
    if (!isBomComponentSelectable(component.stock)) return total;
    const row = selection[component.pn];
    if (!row?.selected) return total;
    // Catalog kit composition qty (parent line qty applied in getLineTotal).
    return total + component.unitPrice * Math.max(1, component.defaultQty);
  }, 0);
}

/** Line total including parent kit quantity. */
export function getLineTotal(line: BomPricedLine): number {
  return getLineUnitPrice(line) * Math.max(1, line.quantity);
}

export interface BomSelectionStats {
  selectedCount: number;
  /** Selectable (in-stock / limited) components only. */
  availableCount: number;
  totalCount: number;
  isCustom: boolean;
  noneSelected: boolean;
  allSelected: boolean;
}

/** Parent kit inventory badge derived from selected sub-components only. */
export interface KitInventoryBadge {
  color: 'success' | 'warning' | 'danger';
  icon: string;
  label: string;
  available: number;
}

const kitInventoryByPriority: Record<
  'backordered' | 'limited' | 'in-stock',
  KitInventoryBadge
> = {
  backordered: {
    color: 'warning',
    icon: 'warning',
    label: 'Component Backordered',
    available: 0,
  },
  limited: {
    color: 'warning',
    icon: 'warning',
    label: 'Limited availability',
    available: 20,
  },
  'in-stock': {
    color: 'success',
    icon: 'check_circle',
    label: 'Plenty in stock',
    available: 99,
  },
};

function selectedBomComponents(line: BomPricedLine): ResolvedBomComponent[] {
  const components = resolveBomComponents(line.product);
  const selection = selectionForLine(line) ?? {};
  return components.filter((component) => selection[component.pn]?.selected);
}

/**
 * Parent kit stock from checked, selectable BOM rows only:
 * any limited → Limited; else Plenty. Out-of-stock rows are never selected.
 */
export function getKitInventoryBadge(line: BomPricedLine): KitInventoryBadge | null {
  const bom = line.product.bom ?? [];
  if (!line.product.isKit || bom.length === 0) return null;

  const selected = selectedBomComponents(line).filter((c) =>
    isBomComponentSelectable(c.stock)
  );
  if (selected.length === 0) return kitInventoryByPriority['in-stock'];

  if (selected.some((c) => c.stock === 'limited')) {
    return kitInventoryByPriority.limited;
  }
  return kitInventoryByPriority['in-stock'];
}

export function getBomSelectionStats(line: BomPricedLine): BomSelectionStats {
  const components = resolveBomComponents(line.product);
  const totalCount = components.length;
  if (totalCount === 0) {
    return {
      selectedCount: 0,
      availableCount: 0,
      totalCount: 0,
      isCustom: false,
      noneSelected: false,
      allSelected: true,
    };
  }

  const selection = selectionForLine(line) ?? {};
  const available = components.filter((c) => isBomComponentSelectable(c.stock));
  let selectedCount = 0;
  let qtyChanged = false;

  for (const component of available) {
    const row = selection[component.pn];
    if (row?.selected) selectedCount += 1;
    if (row && row.quantity !== component.defaultQty) qtyChanged = true;
  }

  const availableCount = available.length;
  const allSelected = availableCount > 0 && selectedCount === availableCount;
  const noneSelected = selectedCount === 0;
  const isCustom =
    (!allSelected && !noneSelected) || (allSelected && qtyChanged);

  return {
    selectedCount,
    availableCount,
    totalCount,
    isCustom,
    noneSelected,
    allSelected,
  };
}
