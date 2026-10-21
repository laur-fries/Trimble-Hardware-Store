import {
  ModusWcButton,
  ModusWcModal,
  ModusWcTable,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { CatalogProduct } from '../catalogData';

export const BOM_MODAL_ID = 'bom-modal';

const dialog = () =>
  document.getElementById(BOM_MODAL_ID) as HTMLDialogElement | null;

export const openBomModal = () => dialog()?.showModal();
const closeBomModal = () => dialog()?.close();

// Column definitions are stable across renders so the table does not re-init.
const columns = [
  {
    id: 'pn',
    header: 'Part Number',
    accessor: 'pn',
    width: '38%',
    cellRenderer: (value: unknown) => {
      const span = document.createElement('span');
      span.className = 'part-number';
      span.textContent = typeof value === 'string' ? value : String(value ?? '');
      return span;
    },
  },
  { id: 'name', header: 'Description', accessor: 'name' },
  { id: 'qty', header: 'Qty', accessor: 'qty', width: '64px' },
];

export default function BomModal({ product }: { product: CatalogProduct | null }) {
  const data = (product?.bom ?? []) as unknown as Record<string, unknown>[];

  return (
    <ModusWcModal
      modalId={BOM_MODAL_ID}
      backdrop="default"
      position="center"
      showClose
      aria-label="Included parts, bill of materials"
    >
      <div slot="header" className="flex min-w-0 flex-col gap-0.5">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Included Parts (BOM)"
        />
        {product ? (
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label={`${product.name} · PN: ${product.partNumber}`}
          />
        ) : null}
      </div>

      <div slot="content" className="min-w-0">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="mb-3 text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Each sub-component below is individually orderable."
        />
        <ModusWcTable columns={columns} data={data} sortable={false} />
      </div>

      <div slot="footer" className="flex justify-end">
        <ModusWcButton
          variant="outlined"
          color="tertiary"
          size="sm"
          aria-label="Close bill of materials"
          onButtonClick={closeBomModal}
        >
          Close
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}
