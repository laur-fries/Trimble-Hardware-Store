import { ModusWcAlert } from '@trimble-oss/moduswebcomponents-react';

export interface ReplacementNoticeBannerProps {
  replaces: { pn: string; title: string }[];
}

/** PDP info banner shown on a SKU that directly replaces one or more legacy parts. */
export function ReplacementNoticeBanner({ replaces }: ReplacementNoticeBannerProps) {
  if (replaces.length === 0) return null;
  const parts = replaces.map((r) => `${r.pn} (${r.title})`).join(', ');
  return (
    <ModusWcAlert
      variant="info"
      icon="info"
      role="status"
      alertTitle={
        replaces.length === 1
          ? `Direct replacement for legacy Part # ${parts}`
          : `Direct replacement for legacy parts: ${parts}`
      }
    />
  );
}

export default ReplacementNoticeBanner;
