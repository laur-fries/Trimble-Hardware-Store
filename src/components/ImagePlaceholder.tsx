import { ModusWcIcon, ModusWcTypography } from '@trimble-oss/moduswebcomponents-react';

/**
 * Dashed image placeholder used for category and product imagery in the
 * prototype, mirroring the wireframe's "Image" boxes.
 */
export default function ImagePlaceholder({ label = 'Image' }: { label?: string }) {
  return (
    <div className="image-placeholder" role="img" aria-label={`${label} placeholder`}>
      <ModusWcIcon name="image" size="md" decorative />
      <ModusWcTypography hierarchy="p" size="sm" label={label} />
    </div>
  );
}
