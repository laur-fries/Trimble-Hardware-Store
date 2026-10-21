import { Link } from 'react-router-dom';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';
import {
  resolveStandaloneProduct,
  type UniversalBomRow,
} from '../../catalog/productBom';
import { productDetailPath } from '../../catalog/productLookup';

export type CartBomRowProps = {
  row: UniversalBomRow;
};

/** Single-line read-only BOM row: thumbnail, PN, title (link when orderable), qty. */
export default function CartBomRow({ row }: CartBomRowProps) {
  const standalone = row.isOrderable ? resolveStandaloneProduct(row) : undefined;

  return (
    <div className="cart-bom-row">
      <div className="cart-bom-row-details">
        <img
          src={row.imageUrl}
          alt={row.title}
          loading="lazy"
          className="cart-bom-row-thumb"
        />
        <div className="cart-bom-row-text">
          <span className="cart-bom-row-pn">PN: {row.pn}</span>
          {standalone ? (
            <Link
              to={productDetailPath(standalone)}
              target="_blank"
              rel="noopener noreferrer"
              className="cart-bom-row-link"
              aria-label={`${row.title} (opens in a new tab)`}
            >
              {row.title}
              <ModusWcIcon name="launch" size="xs" decorative />
            </Link>
          ) : (
            <span className="cart-bom-row-title">{row.title}</span>
          )}
        </div>
      </div>

      <span
        className="cart-bom-row-qty"
        aria-label={`Quantity ${row.qtyPerPackage}`}
      >
        {row.qtyPerPackage}x
      </span>
    </div>
  );
}
