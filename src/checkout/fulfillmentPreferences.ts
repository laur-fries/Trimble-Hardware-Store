/** Partial shipments vs hold-until-complete fulfillment. */
export type FulfillmentPreference = 'partial' | 'ship_complete';

export const DEFAULT_FULFILLMENT_PREFERENCE: FulfillmentPreference = 'partial';

/**
 * ISO `yyyy-mm-dd` bounds for requested ship date (today .. today + 30 days),
 * in the dealer's local calendar — `toISOString()` is UTC and would roll to
 * tomorrow during US evenings.
 */
export function requestedShipDateBounds(): { min: string; max: string } {
  const today = new Date();
  const max = new Date(today);
  max.setDate(max.getDate() + 30);

  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  return { min: toIso(today), max: toIso(max) };
}
