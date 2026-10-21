import { parsePrice, type CatalogProduct } from '../catalogData';
import { findCatalogProduct } from '../catalog/productLookup';
import type { KitBomLine, LineItem } from './types';

const FALLBACK_IMAGE = '/products/gnss-receiver.png';

/** Resolve a catalog thumbnail (and kit BOM) for an order line. */
export function enrichLineItem(item: LineItem): LineItem {
  const product = findCatalogProduct(item.partNumber);
  const image = item.image || product?.image || FALLBACK_IMAGE;
  const kitBom =
    item.kitBom ??
    (product?.isKit && product.bom?.length
      ? product.bom.map(
          (b): KitBomLine => ({
            partNumber: b.pn,
            title: b.name,
            quantity: b.qty,
            unitPrice: b.unitPrice ? parsePrice(b.unitPrice) : undefined,
            image: b.image || product.image,
          })
        )
      : undefined);

  return { ...item, image, kitBom };
}

export function enrichLineItems(items: LineItem[]): LineItem[] {
  return items.map(enrichLineItem);
}

/** Build a lightweight catalog product for reorder when PN is unknown. */
export function lineItemToCatalogProduct(item: LineItem): CatalogProduct {
  const existing = findCatalogProduct(item.partNumber);
  if (existing) return existing;

  return {
    id: `reorder-${item.partNumber}`,
    name: item.title,
    description: `Reordered from prior sales order · PN ${item.partNumber}`,
    partNumber: item.partNumber,
    price: `$${item.unitPrice.toFixed(2)}`,
    image: item.image || FALLBACK_IMAGE,
    stock: 'in-stock',
    facets: {},
  };
}

/** Prototype PDF stub download (text payload with .pdf extension). */
export function downloadDocumentStub(filename: string, body: string): void {
  const blob = new Blob([body], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
