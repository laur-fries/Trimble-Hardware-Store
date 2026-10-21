/** Shown when special shipping instructions trigger manual review hold. */
export const DELIVERY_PENDING_SHIPPING_REVIEW =
  'Delivery date pending shipping review';

export function formatConfirmationArrivalLine(options: {
  hasSpecialInstructions: boolean;
  placedAt?: string;
  daysFromPlaced?: number;
  carrierLabel?: string;
}): string {
  if (options.hasSpecialInstructions) {
    return DELIVERY_PENDING_SHIPPING_REVIEW;
  }
  const placed = options.placedAt ? new Date(options.placedAt) : new Date();
  const arrival = new Date(placed);
  arrival.setDate(arrival.getDate() + (options.daysFromPlaced ?? 10));
  const dateLabel = arrival.toLocaleDateString('en-US', { dateStyle: 'medium' });
  const carrier = options.carrierLabel?.trim();
  return carrier
    ? `Estimated arrival: ${dateLabel} via ${carrier}`
    : `Estimated arrival: ${dateLabel}`;
}
