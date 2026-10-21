import {
  catalogProducts,
  parsePrice,
  type CatalogProduct,
  type ReplacementProductRef,
} from '../catalogData';

/** True when the SKU is discontinued (not orderable). */
export function isDiscontinuedProduct(
  product: Pick<CatalogProduct, 'isDiscontinued'>
): boolean {
  return Boolean(product.isDiscontinued);
}

/** Resolved replacement catalog product, when the mapping points at a live SKU. */
export function resolveReplacementProduct(
  product: Pick<CatalogProduct, 'replacementProduct'>
): CatalogProduct | undefined {
  const ref = product.replacementProduct;
  if (!ref) return undefined;
  return catalogProducts.find((p) => p.id === ref.id || p.partNumber === ref.partNumber);
}

/** Legacy SKUs that list `product` as their direct replacement. */
export function findLegacyProductsReplacedBy(
  product: Pick<CatalogProduct, 'id' | 'partNumber'>
): CatalogProduct[] {
  return catalogProducts.filter(
    (p) =>
      p.isDiscontinued &&
      p.replacementProduct &&
      (p.replacementProduct.id === product.id ||
        p.replacementProduct.partNumber === product.partNumber)
  );
}

export function replacementRefPriceAmount(ref: ReplacementProductRef): number {
  return parsePrice(ref.price);
}

export function cartHasDiscontinuedItems(
  lines: { product: Pick<CatalogProduct, 'isDiscontinued'> }[]
): boolean {
  return lines.some((line) => isDiscontinuedProduct(line.product));
}
