import { useState } from 'react';
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcModal,
  ModusWcRadio,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import {
  SHIPPING_OPTIONS,
  getShippingOptionById,
} from '../../checkout/checkoutData';
import { readInputChecked } from '../../utils/modusFormEvents';

export const SHIPPING_OPTION_MODAL_ID = 'checkout-shipping-option-modal';

const dialog = () =>
  document.getElementById(SHIPPING_OPTION_MODAL_ID) as HTMLDialogElement | null;

export const openShippingOptionModal = () => dialog()?.showModal();
export const closeShippingOptionModal = () => dialog()?.close();

interface ShippingOptionCardProps {
  shippingOptionId: string;
  onShippingOptionChange: (id: string) => void;
}

export default function ShippingOptionCard({
  shippingOptionId,
  onShippingOptionChange,
}: ShippingOptionCardProps) {
  const [draftId, setDraftId] = useState(shippingOptionId);
  const option =
    getShippingOptionById(shippingOptionId) ?? SHIPPING_OPTIONS[0];

  const openModal = () => {
    setDraftId(shippingOptionId);
    openShippingOptionModal();
  };

  const confirm = () => {
    onShippingOptionChange(draftId);
    closeShippingOptionModal();
  };

  return (
    <>
      <ModusWcCard bordered={true} padding="compact">
        <div
          slot="title"
          className="flex w-full min-w-0 items-center justify-between gap-3"
        >
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label="Shipping Option"
          />
          <ModusWcButton
            className="cart-text-link-host"
            color="primary"
            variant="borderless"
            size="sm"
            customClass="cart-text-link"
            aria-label="Change shipping option"
            onButtonClick={openModal}
          >
            Change shipping option
          </ModusWcButton>
        </div>

        <div className="flex flex-col gap-3 px-1 pb-1 pt-2">
          <div className="flex flex-col gap-1">
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label="Carrier"
            />
            <ModusWcTypography
              hierarchy="p"
              size="md"
              weight="semibold"
              label={option.carrier}
            />
          </div>
          <div className="flex flex-col gap-1">
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label="Account #"
            />
            <ModusWcTypography
              hierarchy="p"
              size="md"
              weight="semibold"
              customClass="font-mono tabular-nums"
              label={option.accountNumber}
            />
          </div>
        </div>
      </ModusWcCard>

      <ModusWcModal
        modalId={SHIPPING_OPTION_MODAL_ID}
        backdrop="default"
        position="center"
        showClose
        aria-label="Select shipping option"
      >
        <div slot="header">
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label="Select shipping option"
          />
        </div>

        <div slot="content" className="flex min-w-0 flex-col gap-2">
          {SHIPPING_OPTIONS.map((opt) => (
            <div
              key={opt.id}
              className="rounded-[var(--modus-wc-radius-md)] border border-[var(--modus-wc-color-base-200)] bg-[var(--modus-wc-color-base-100)] p-3"
            >
              <ModusWcRadio
                name="checkout-shipping-option"
                label={`${opt.carrier} · ${opt.accountNumber}`}
                value={draftId === opt.id}
                onInputChange={(e: CustomEvent) => {
                  if (readInputChecked(e)) setDraftId(opt.id);
                }}
              />
            </div>
          ))}
        </div>

        <div slot="footer" className="flex justify-end gap-2">
          <ModusWcButton
            variant="outlined"
            color="tertiary"
            size="sm"
            aria-label="Cancel shipping option change"
            onButtonClick={closeShippingOptionModal}
          >
            Cancel
          </ModusWcButton>
          <ModusWcButton
            variant="filled"
            color="primary"
            size="sm"
            aria-label="Use selected shipping option"
            onButtonClick={confirm}
          >
            Use this option
          </ModusWcButton>
        </div>
      </ModusWcModal>
    </>
  );
}
