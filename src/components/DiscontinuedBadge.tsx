import { ModusWcBadge, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/** Red "DISCONTINUED" status badge with a leading alert triangle. */
export default function DiscontinuedBadge() {
  return (
    <ModusWcBadge
      variant="filled"
      color="danger"
      size="sm"
      customClass="discontinued-badge"
    >
      <ModusWcIcon name="alert" variant="solid" size="xs" decorative />
      DISCONTINUED
    </ModusWcBadge>
  );
}
