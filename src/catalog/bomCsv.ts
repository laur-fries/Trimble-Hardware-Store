import type { CatalogProduct, StockStatus } from '../catalogData';
import { downloadCsv, toCsv, type CsvCell } from '../utils/csv';
import { getUniversalProductBom, type UniversalBomRow } from './productBom';

const STOCK_LABEL: Record<StockStatus, string> = {
  'in-stock': 'In stock',
  limited: 'Limited availability',
  'out-of-stock': 'Backordered',
};

const HEADER = [
  'Item',
  'Level',
  'Parent PN',
  'PN',
  'Title',
  'Description',
  'Qty per package',
  'Orderable',
  'Standalone price (Net USD)',
  'Stock status',
];

function flattenRows(
  rows: UniversalBomRow[],
  parentPn: string,
  prefix: string,
  level: number
): CsvCell[][] {
  return rows.flatMap((row, index) => {
    const item = prefix ? `${prefix}.${index + 1}` : String(index + 1);
    const line = [
      item,
      level,
      parentPn,
      row.pn,
      row.title,
      row.description,
      row.qtyPerPackage,
      row.isOrderable ? 'Yes' : 'No',
      row.isOrderable && row.standalonePrice != null
        ? row.standalonePrice.toFixed(2)
        : '',
      row.isOrderable ? STOCK_LABEL[row.stock] : '',
    ];
    return [line, ...flattenRows(row.children ?? [], row.pn, item, level + 1)];
  });
}

/** Full BOM (including nested sub-assemblies) as CSV, one row per component. */
export function buildBomCsv(product: CatalogProduct): string {
  const rows = flattenRows(
    getUniversalProductBom(product),
    product.partNumber,
    '',
    1
  );
  return toCsv([HEADER, ...rows]);
}

/** Triggers a browser download of `{PN}-bom.csv`. */
export function handleDownloadBomCsv(product: CatalogProduct): void {
  downloadCsv(`${product.partNumber}-bom.csv`, buildBomCsv(product));
}
