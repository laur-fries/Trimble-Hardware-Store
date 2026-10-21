import { ModusWcAlert } from '@trimble-oss/moduswebcomponents-react';
import type { CartLine } from '../../cart/CartContext';
import { cartHasDiscontinuedItems } from '../../catalog/discontinuation';

interface CartDiscontinuedAlertProps {
  items: CartLine[];
}

/** Cart-level warning when any line is a discontinued SKU. */
export default function CartDiscontinuedAlert({
  items,
}: CartDiscontinuedAlertProps) {
  if (!cartHasDiscontinuedItems(items)) return null;

  return (
    <ModusWcAlert
      variant="error"
      icon="alert"
      role="alert"
      customClass="cart-discontinued-alert"
      alertTitle="1 or more items in your cart have been discontinued"
      alertDescription="Please update your cart to proceed to checkout."
    />
  );
}
