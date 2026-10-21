import { useMemo, useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcModal,
  ModusWcTextarea,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { readInputString } from '../utils/modusFormEvents';

export const DIRECT_ORDER_MODAL_ID = 'direct-order-modal';

const dialog = () =>
  document.getElementById(DIRECT_ORDER_MODAL_ID) as HTMLDialogElement | null;

export const openDirectOrderModal = () => dialog()?.showModal();
const closeDirectOrderModal = () => dialog()?.close();

/**
 * Bulk part-number scratchpad. Dealers paste PNs / CSV rows (one per line,
 * optional quantity after a comma) to add many line items at once.
 */
export default function DirectOrderModal({
  onAddLines,
}: {
  onAddLines?: (lines: string[]) => void;
}) {
  const [text, setText] = useState('');

  const lines = useMemo(
    () =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [text]
  );

  const submit = () => {
    onAddLines?.(lines);
    setText('');
    closeDirectOrderModal();
  };

  const cancel = () => {
    setText('');
    closeDirectOrderModal();
  };

  return (
    <ModusWcModal
      modalId={DIRECT_ORDER_MODAL_ID}
      backdrop="default"
      position="center"
      showClose
      aria-label="Direct order entry"
    >
      <div slot="header">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Direct Order Entry"
        />
      </div>

      <div slot="content" className="flex min-w-0 flex-col gap-3">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Paste part numbers or CSV — one item per line, with an optional quantity after a comma (e.g. 82758-00, 2). We'll match them to catalog items."
        />
        <ModusWcTextarea
          label="Part numbers"
          placeholder={'82758-00, 2\n121760-00\n58957-10, 4'}
          value={text}
          rows={7}
          onInputChange={(e: CustomEvent) => setText(readInputString(e))}
        />
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label={`${lines.length} line${lines.length === 1 ? '' : 's'} detected`}
        />
      </div>

      <div slot="footer" className="flex justify-end gap-2">
        <ModusWcButton
          variant="outlined"
          color="tertiary"
          size="sm"
          aria-label="Cancel direct order entry"
          onButtonClick={cancel}
        >
          Cancel
        </ModusWcButton>
        <ModusWcButton
          variant="filled"
          color="primary"
          size="sm"
          disabled={lines.length === 0}
          aria-label="Add pasted part numbers to order"
          onButtonClick={submit}
        >
          <ModusWcIcon name="add" size="xs" decorative />
          Add to order
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}
