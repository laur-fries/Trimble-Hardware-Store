import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcModal,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { OrderLineItemRow } from '../../types/order';

export const REORDER_DISCONTINUED_MODAL_ID = 'reorder-discontinued-modal';

const dialog = () =>
  document.getElementById(REORDER_DISCONTINUED_MODAL_ID) as HTMLDialogElement | null;

export const openReorderDiscontinuedModal = () => dialog()?.showModal();
export const closeReorderDiscontinuedModal = () => dialog()?.close();

export type DiscontinuedReorderLine = OrderLineItemRow & {
  useReplacement: boolean;
};

type ReorderDiscontinuedModalProps = {
  lines: DiscontinuedReorderLine[];
  onConfirm: (lines: DiscontinuedReorderLine[]) => void;
};

export default function ReorderDiscontinuedModal({
  lines,
  onConfirm,
}: ReorderDiscontinuedModalProps) {
  const discontinued = lines.filter((line) => line.isDiscontinued);

  return (
    <ModusWcModal
      modalId={REORDER_DISCONTINUED_MODAL_ID}
      backdrop="default"
      position="center"
      showClose
      aria-label="Discontinued items in reorder"
    >
      <div slot="header">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Discontinued items detected"
        />
      </div>

      <div slot="content" className="flex flex-col gap-3">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          label="Some parts in this order are discontinued. Confirm replacements before adding to cart."
        />
        <ul className="flex flex-col gap-2" aria-label="Discontinued line items">
          {discontinued.map((line) => (
            <li
              key={line.pn}
              className="flex flex-col gap-1 rounded-md border border-[var(--modus-wc-color-base-200)] p-3"
            >
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                weight="semibold"
                label={`${line.title} (PN ${line.pn})`}
              />
              {line.replacementPn ? (
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label={`Suggested replacement: PN ${line.replacementPn}`}
                />
              ) : (
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="text-[var(--modus-wc-color-error)]"
                  label="No replacement mapping — item will be skipped."
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      <div slot="footer" className="flex w-full justify-end gap-2">
        <ModusWcButton
          color="tertiary"
          variant="outlined"
          size="sm"
          onButtonClick={closeReorderDiscontinuedModal}
        >
          Cancel
        </ModusWcButton>
        <ModusWcButton
          color="primary"
          variant="filled"
          size="sm"
          onButtonClick={() => {
            onConfirm(
              lines.map((line) => ({
                ...line,
                useReplacement: Boolean(
                  line.isDiscontinued && line.replacementPn
                ),
              }))
            );
            closeReorderDiscontinuedModal();
          }}
        >
          <ModusWcIcon name="refresh" size="xs" decorative />
          Add to cart with replacements
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}
