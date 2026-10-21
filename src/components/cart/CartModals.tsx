import { useState } from 'react';
import {
  ModusWcButton,
  ModusWcModal,
  ModusWcTextInput,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { readInputString } from '../../utils/modusFormEvents';

export const SAVE_LIST_MODAL_ID = 'save-list-modal';

const saveListDialog = () =>
  document.getElementById(SAVE_LIST_MODAL_ID) as HTMLDialogElement | null;

export const openSaveListModal = () => saveListDialog()?.showModal();
export const closeSaveListModal = () => saveListDialog()?.close();

interface SaveListModalProps {
  onSave: (name: string) => void;
}

export function SaveListModal({ onSave }: SaveListModalProps) {
  const [name, setName] = useState('');

  const submit = () => {
    onSave(name.trim());
    setName('');
    closeSaveListModal();
  };

  const cancel = () => {
    setName('');
    closeSaveListModal();
  };

  return (
    <ModusWcModal
      modalId={SAVE_LIST_MODAL_ID}
      backdrop="default"
      position="center"
      showClose
      aria-label="Save cart as list"
    >
      <div slot="header">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Save as list"
        />
      </div>

      <div slot="content" className="flex min-w-0 flex-col gap-3">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="Save the current cart as a reusable template without overwriting existing lists."
        />
        <ModusWcTextInput
          label="List name"
          placeholder="e.g. Q3 Earthworks starter kit"
          value={name}
          onInputChange={(e: CustomEvent) => setName(readInputString(e))}
        />
      </div>

      <div slot="footer" className="flex justify-end gap-2">
        <ModusWcButton
          variant="outlined"
          color="tertiary"
          size="sm"
          aria-label="Cancel save list"
          onButtonClick={cancel}
        >
          Cancel
        </ModusWcButton>
        <ModusWcButton
          variant="filled"
          color="primary"
          size="sm"
          disabled={!name.trim()}
          aria-label="Save cart as list"
          onButtonClick={submit}
        >
          Save list
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}
