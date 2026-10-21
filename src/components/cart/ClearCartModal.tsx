import {
  ModusWcButton,
  ModusWcModal,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';

export const CLEAR_CART_MODAL_ID = 'clear-cart-modal';

const dialog = () =>
  document.getElementById(CLEAR_CART_MODAL_ID) as HTMLDialogElement | null;

export const openClearCartModal = () => dialog()?.showModal();
export const closeClearCartModal = () => dialog()?.close();

interface ClearCartModalProps {
  onConfirm: () => void;
}

export default function ClearCartModal({ onConfirm }: ClearCartModalProps) {
  return (
    <ModusWcModal
      modalId={CLEAR_CART_MODAL_ID}
      backdrop="default"
      position="center"
      showClose
      aria-label="Clear cart confirmation"
    >
      <div slot="header">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Clear cart?"
        />
      </div>

      <div slot="content">
        <ModusWcTypography
          hierarchy="p"
          size="sm"
          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
          label="This removes every line item from your cart. This action cannot be undone."
        />
      </div>

      <div slot="footer" className="flex justify-end gap-2">
        <ModusWcButton
          variant="outlined"
          color="tertiary"
          size="sm"
          aria-label="Cancel clear cart"
          onButtonClick={closeClearCartModal}
        >
          Cancel
        </ModusWcButton>
        <ModusWcButton
          variant="filled"
          color="primary"
          size="sm"
          aria-label="Confirm clear cart"
          onButtonClick={() => {
            onConfirm();
            closeClearCartModal();
          }}
        >
          Clear cart
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}
