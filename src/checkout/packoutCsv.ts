import { getUniversalProductBom } from '../catalog/productBom';
import { catalogProducts } from '../catalogData';
import { downloadCsv, toCsv, type CsvCell } from '../utils/csv';
import type { ConfirmationShipment } from './confirmation';

const HEADER = [
  'Line',
  'Part number',
  'Description',
  'Quantity',
  'Unit net price',
  'Line total',
];

/**
 * Digital pack-out list for one shipment. Kits bill as a single SKU but are
 * exploded into component rows (1.1, 1.2, …) for warehouse receiving.
 */
export function buildPackoutCsv(shipment: ConfirmationShipment): string {
  const rows: CsvCell[][] = shipment.items.flatMap((item, index) => {
    const line = String(index + 1);
    const parent: CsvCell[] = [
      line,
      item.partNumber,
      item.title,
      item.quantity,
      item.unitPrice.toFixed(2),
      (item.unitPrice * item.quantity).toFixed(2),
    ];
    if (!item.isKit) return [parent];

    const product = catalogProducts.find((p) => p.id === item.productId);
    const components = product ? getUniversalProductBom(product) : [];
    return [
      parent,
      ...components.map((component, componentIndex): CsvCell[] => [
        `${line}.${componentIndex + 1}`,
        component.pn,
        component.title,
        component.qtyPerPackage * item.quantity,
        '',
        '',
      ]),
    ];
  });
  return toCsv([HEADER, ...rows]);
}

export function downloadPackoutCsv(
  shipment: ConfirmationShipment,
  salesOrderNumber: string
): void {
  const location = shipment.addressLabel.replace(/[^\w-]+/g, '_');
  downloadCsv(
    `Packout_${salesOrderNumber}_${location}.csv`,
    buildPackoutCsv(shipment)
  );
}
