import {
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';

export type SpecialShippingReviewPanelProps = {
  instructionsText: string;
};

/** Inline special-instructions review block for order card and drawer. */
export default function SpecialShippingReviewPanel({
  instructionsText,
}: SpecialShippingReviewPanelProps) {
  const quote =
    instructionsText.trim() ||
    'No additional shipping notes were captured for this order.';

  return (
    <div className="order-card-special-shipping-review">
      <div className="order-card-special-shipping-review-heading">
        <ModusWcIcon name="warning" size="sm" decorative />
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          weight="semibold"
          label="Special request under review"
        />
      </div>
      <blockquote className="order-card-special-shipping-review-quote">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="order-card-special-shipping-review-quote-text"
          label={`"${quote}"`}
        />
      </blockquote>
      <div className="order-card-special-shipping-review-meta">
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Review team: Trimble Orders and Logistics"
        />
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          weight="semibold"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Estimated review window: 24–48 hours"
        />
      </div>
    </div>
  );
}
