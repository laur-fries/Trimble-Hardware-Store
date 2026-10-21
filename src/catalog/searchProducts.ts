import { catalogProducts, type CatalogProduct } from '../catalogData';

/** Lowercase + trim for general text matching. */
export function normalizeSearchText(value: string): string {
  return value.toLowerCase().trim();
}

/** Alphanumeric-only form so `82758-00` matches `82758 00` / `8275800`. */
export function normalizePartNumber(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Ranked product search across name and part number (description as a weak
 * signal). Returns every match, best matches first. Empty query → [].
 */
export function searchCatalogProducts(
  query: string,
  products: readonly CatalogProduct[] = catalogProducts
): CatalogProduct[] {
  const raw = query.trim();
  if (!raw) return [];

  const q = normalizeSearchText(raw);
  const qCompact = normalizePartNumber(raw);
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored: { product: CatalogProduct; score: number }[] = [];

  for (const product of products) {
    const name = normalizeSearchText(product.name);
    const pn = normalizeSearchText(product.partNumber);
    const pnCompact = normalizePartNumber(product.partNumber);
    const desc = normalizeSearchText(product.description ?? '');
    const haystack = `${name} ${pn} ${pnCompact} ${desc}`;

    const allTokensMatch = tokens.every((token) => {
      const compact = normalizePartNumber(token);
      return (
        haystack.includes(token) ||
        (compact.length > 0 && pnCompact.includes(compact))
      );
    });
    if (!allTokensMatch) continue;

    let score = 0;

    if (pn === q || (qCompact.length > 0 && pnCompact === qCompact)) {
      score += 1000;
    } else if (
      pn.startsWith(q) ||
      (qCompact.length > 0 && pnCompact.startsWith(qCompact))
    ) {
      score += 800;
    } else if (
      pn.includes(q) ||
      (qCompact.length > 0 && pnCompact.includes(qCompact))
    ) {
      score += 600;
    }

    if (name === q) score += 500;
    else if (name.startsWith(q)) score += 400;
    else if (name.includes(q)) score += 300;

    if (desc.includes(q)) score += 40;

    // Token-only hits (e.g. multi-word AND) still qualify.
    if (score === 0) score = 10;

    scored.push({ product, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score || a.product.name.localeCompare(b.product.name)
  );

  return scored.map((entry) => entry.product);
}
