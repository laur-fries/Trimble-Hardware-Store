import { Link } from 'react-router-dom';
import { ModusWcTypography } from '@trimble-oss/moduswebcomponents-react';

interface ProductTitleLinkProps {
  to: string;
  name: string;
  hierarchy?: 'h3' | 'p';
  size?: 'sm' | 'md';
  weight?: 'semibold' | 'bold';
  customClass?: string;
}

/**
 * Primary-colored text link to a product detail page.
 */
export default function ProductTitleLink({
  to,
  name,
  hierarchy = 'h3',
  size = 'md',
  weight = 'semibold',
  customClass = 'line-clamp-2',
}: ProductTitleLinkProps) {
  return (
    <Link
      to={to}
      className="product-title-link"
      aria-label={`View product details for ${name}`}
    >
      <ModusWcTypography
        hierarchy={hierarchy}
        size={size}
        weight={weight}
        customClass={customClass}
      >
        {name}
      </ModusWcTypography>
    </Link>
  );
}
