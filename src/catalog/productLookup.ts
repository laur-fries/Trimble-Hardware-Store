import { catalogProducts, type CatalogProduct } from '../catalogData';
import { productBomDeepLink } from './productBom';

/** Resolve a catalog product by id or part number. */
export function findCatalogProduct(idOrPn: string): CatalogProduct | undefined {
  const key = decodeURIComponent(idOrPn).trim();
  if (!key) return undefined;
  return catalogProducts.find(
    (p) => p.id === key || p.partNumber === key
  );
}

/** Product detail path for a catalog product. */
export function productDetailPath(product: Pick<CatalogProduct, 'id'>): string {
  return `/product/${product.id}`;
}

/** Product detail path scrolled to the universal bill-of-materials section. */
export function productDetailBomPath(
  product: Pick<CatalogProduct, 'id' | 'partNumber'>
): string {
  return productBomDeepLink(product);
}

/** Product detail path for a PN (catalog match preferred when present). */
export function productDetailPathForPn(pn: string): string {
  const match = catalogProducts.find((p) => p.partNumber === pn);
  if (match) return productDetailPath(match);
  return `/product/${encodeURIComponent(pn)}`;
}

/**
 * Build a lightweight catalog-shaped product for kit-only BOM PNs that are
 * not sold as standalone SKUs.
 */
export function resolveDisplayProduct(idOrPn: string): CatalogProduct | undefined {
  const direct = findCatalogProduct(idOrPn);
  if (direct) return direct;

  const pn = decodeURIComponent(idOrPn).trim();
  for (const parent of catalogProducts) {
    const bomItem = parent.bom?.find((b) => b.pn === pn);
    if (!bomItem) continue;
    return {
      id: `bom-${pn}`,
      name: bomItem.name,
      description:
        bomItem.description ||
        `Kit component from ${parent.name}. Contact Trimble Sales for standalone ordering.`,
      partNumber: bomItem.pn,
      price: bomItem.unitPrice || parent.price,
      listPrice: bomItem.unitPrice,
      image: bomItem.image || parent.image,
      stock: bomItem.stock || parent.stock,
      facets: parent.facets,
    };
  }
  return undefined;
}
