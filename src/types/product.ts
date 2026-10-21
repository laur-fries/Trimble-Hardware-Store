/**
 * Universal Bill of Materials types (B2B Hardware Store).
 * Runtime catalog records use `CatalogProduct` in `catalogData.ts`; field mapping:
 * `pn` ↔ partNumber, `title` ↔ name, `priceDealerNet` ↔ parsePrice(price), etc.
 */
export type ProductStockStatus =
  | 'PLENTY_IN_STOCK'
  | 'LOW_STOCK'
  | 'BACKORDERED';

export interface BomComponent {
  pn: string;
  title: string;
  description?: string;
  qtyPerPackage: number;
  imageUrl?: string;
  /** True if sold separately as an independent catalog SKU. */
  isOrderable: boolean;
  /** Net price when orderable standalone. */
  standalonePrice?: number;
  /** Target PN when the row links to a standalone SKU. */
  standalonePn?: string;
  /** e.g. "Factory component" or "Orderable replacement accessory". */
  note?: string;
  stockStatus?: string;
  /** Nested sub-assembly components. */
  children?: BomComponent[];
}

/** @deprecated Use `BomComponent`. */
export type BomItem = BomComponent;

export interface Product {
  id: string;
  pn: string;
  title: string;
  description: string;
  priceMsrp: number;
  priceDealerNet: number;
  imageUrl: string;
  galleryImages?: string[];
  /** True for pre-packaged bundles; false for single hardware units. */
  isKit: boolean;
  /** Savings delta vs. buying components separately. */
  bundleSavings?: number;
  /**
   * Universal BOM; never contains the parent PN. Empty when the catalog BOM
   * lists only the parent SKU itself (single-item bypass).
   */
  bom: BomComponent[];
  category?: string;
  stockStatus?: ProductStockStatus;
}

export type { CatalogProduct } from '../catalogData';
/** Raw BOM row shape stored on `CatalogProduct.bom`. */
export type { BomItem as CatalogBomLineRaw } from '../catalogData';
