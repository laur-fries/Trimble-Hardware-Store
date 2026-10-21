import { catalogProducts, type CatalogProduct } from '../catalogData';

export interface FrequentlyPurchasedItem {
  product: CatalogProduct;
  /** Demo org-level purchase volume used for ranking. */
  timesPurchased: number;
}

/**
 * Ranked “buy again” SKUs for the empty-cart recommendations rail.
 * IDs must exist in `catalogProducts` so Add to cart uses real catalog lines.
 */
const RANKED_PURCHASES: ReadonlyArray<{ id: string; timesPurchased: number }> = [
  { id: 'prod-2', timesPurchased: 186 },
  { id: 'prod-1', timesPurchased: 142 },
  { id: 'prod-4', timesPurchased: 128 },
  { id: 'prod-5', timesPurchased: 97 },
  { id: 'prod-6', timesPurchased: 84 },
  { id: 'prod-7', timesPurchased: 71 },
];

/** Top N frequently purchased catalog products (default 5). */
export function getTopFrequentlyPurchased(
  limit = 5
): FrequentlyPurchasedItem[] {
  const byId = new Map(catalogProducts.map((p) => [p.id, p]));

  return RANKED_PURCHASES.map((row) => {
    const product = byId.get(row.id);
    if (!product) return null;
    return { product, timesPurchased: row.timesPurchased };
  })
    .filter((item): item is FrequentlyPurchasedItem => item !== null)
    .slice(0, limit);
}
