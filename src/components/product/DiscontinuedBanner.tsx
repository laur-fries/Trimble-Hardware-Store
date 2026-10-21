import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcIcon,
} from '@trimble-oss/moduswebcomponents-react';

export interface DiscontinuedBannerProps {
  discontinuedDate: string;
  replacementPn: string;
  replacementTitle: string;
  onViewReplacement: (pn: string) => void;
}

/** PDP error banner for a discontinued SKU with a link to its direct replacement. */
export function DiscontinuedBanner({
  discontinuedDate,
  replacementPn,
  replacementTitle,
  onViewReplacement,
}: DiscontinuedBannerProps) {
  return (
    <ModusWcAlert
      variant="error"
      icon="alert"
      role="status"
      customClass="product-discontinued-alert"
      alertTitle={`This item was discontinued on ${discontinuedDate}.`}
      alertDescription={`Direct replacement available: ${replacementTitle} (PN: ${replacementPn})`}
    >
      <div slot="button">
        <ModusWcButton
          color="primary"
          variant="filled"
          size="sm"
          aria-label={`View replacement part ${replacementPn}`}
          onButtonClick={() => onViewReplacement(replacementPn)}
        >
          View replacement part
          <ModusWcIcon name="arrow_right" size="xs" decorative />
        </ModusWcButton>
      </div>
    </ModusWcAlert>
  );
}

export default DiscontinuedBanner;
