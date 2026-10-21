import type { CartLine } from '../cart/CartContext';
import {
  getLineTotal,
  getLineUnitPrice,
  isBomComponentSelectable,
  resolveBomComponents,
} from '../cart/bomHelpers';
import { getKitStockRollup } from '../catalog/productBom';
import type { StockStatus } from '../catalogData';
import type { KitComponent, KitComponentStockStatus, OrderLineItem } from '../types/order';

function mapStockStatus(stock: StockStatus): KitComponentStockStatus {
  if (stock === 'out-of-stock') return 'OUT_OF_STOCK';
  if (stock === 'limited') return 'BACKORDER';
  return 'IN_STOCK';
}

function selectedKitComponents(line: CartLine) {
  const components = resolveBomComponents(line.product);
  return components.filter((component) => {
    if (!isBomComponentSelectable(component.stock)) return false;
    const row = line.bomSelection?.[component.pn];
    return row ? row.selected : true;
  });
}

/** Map a cart line into the checkout order-item view model (kit BOM included). */
export function cartLineToOrderLineItem(line: CartLine): OrderLineItem {
  const unitPrice = getLineUnitPrice(line);
  const totalPrice = getLineTotal(line);
  const kitParts = selectedKitComponents(line);
  const isKit = Boolean(line.product.isKit && kitParts.length > 0);

  const kitComponents: KitComponent[] | undefined = isKit
    ? kitParts.map((component) => ({
        id: `${line.product.id}-${component.pn}`,
        pn: component.pn,
        title: component.name,
        qtyPerKit: component.defaultQty,
        imageUrl: component.image,
        inStockStatus: mapStockStatus(component.stock),
      }))
    : undefined;

  return {
    id: line.product.id,
    pn: line.product.partNumber,
    title: line.product.name,
    quantity: line.quantity,
    unitPrice,
    totalPrice,
    imageUrl: line.product.image,
    isKit,
    kitComponents,
    kitStockRollup: isKit ? getKitStockRollup(kitParts) : undefined,
  };
}

export function cartLinesToOrderLineItems(lines: CartLine[]): OrderLineItem[] {
  return lines.map(cartLineToOrderLineItem);
}
