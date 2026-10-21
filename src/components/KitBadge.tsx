import { ModusWcBadge, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';
import { getUniversalProductBom } from '../catalog/productBom';
import type { CatalogProduct } from '../catalogData';

/** "BUNDLED KIT | N parts" pill for kit SKUs; renders nothing for standalone products. */
export default function KitBadge({ product }: { product: CatalogProduct }) {
  if (!product.isKit) return null;
  const count = getUniversalProductBom(product).length;
  const parts = `${count} ${count === 1 ? 'part' : 'parts'}`;

  return (
    <ModusWcBadge
      variant="filled"
      color="primary"
      size="sm"
      customClass="kit-badge-dark"
      aria-label={`Bundled kit, ${parts}`}
    >
      <ModusWcIcon name="briefcase" size="xs" decorative />
      {`BUNDLED KIT | ${parts}`}
    </ModusWcBadge>
  );
}
