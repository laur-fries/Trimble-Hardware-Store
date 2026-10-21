import { useCallback, useEffect, useState } from 'react';
import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcDivider,
  ModusWcDropdownMenu,
  ModusWcIcon,
  ModusWcMenuItem,
  ModusWcModal,
  ModusWcRadio,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import {
  SHIPPING_OPTIONS,
  type Address,
  type ShippingAddress,
} from '../../checkout/checkoutData';
import { formatShipToRadioLabel } from '../../checkout/shipments';
import {
  currentUser,
  setDefaultShipToId,
} from '../../checkout/userProfile';
import { useAddressDeduplication } from '../../hooks/useAddressDeduplication';
import { readInputChecked } from '../../utils/modusFormEvents';
import EditLocationForm, {
  emptyLocationForm,
  isLocationFormValid,
  locationFormFromAddress,
  type LocationFormValues,
} from './EditLocationForm';

export type ShipToModalView = 'SELECT_SHIP_TO' | 'ADD_LOCATION' | 'EDIT_LOCATION';

const closeDropdownMenu = (e: CustomEvent) => {
  const host = (e.target as HTMLElement | null)?.closest(
    'modus-wc-dropdown-menu'
  ) as (HTMLElement & { menuVisible?: boolean }) | null;
  if (host) host.menuVisible = false;
};

export const EDIT_SHIPMENT_DETAILS_MODAL_ID = 'fulfillment-shipment-details-modal';

/** @deprecated Use EDIT_SHIPMENT_DETAILS_MODAL_ID */
export const EDIT_SHIP_TO_MODAL_ID = EDIT_SHIPMENT_DETAILS_MODAL_ID;

const dialogEl = () =>
  document.getElementById(EDIT_SHIPMENT_DETAILS_MODAL_ID) as HTMLDialogElement | null;

export interface EditShipmentDetailsModalProps {
  addresses: Address[];
  onAddressesChange: (next: Address[]) => void;
  draftAddressId: string;
  onDraftAddressIdChange: (id: string) => void;
  draftCarrierId: string;
  onDraftCarrierIdChange: (id: string) => void;
  sessionStartAddressId: string;
  sessionStartCarrierId: string;
  onRevertSession: () => void;
  onConfirmShipTo: () => void;
  onConfirmCarrier: () => void;
  onAddressRecordUpdated: (
    previousId: string,
    nextAddress: ShippingAddress
  ) => void;
}

/** @deprecated Use EditShipmentDetailsModalProps */
export type EditShipToModalProps = EditShipmentDetailsModalProps;

export default function EditShipmentDetailsModal({
  addresses,
  onAddressesChange,
  draftAddressId,
  onDraftAddressIdChange,
  draftCarrierId,
  onDraftCarrierIdChange,
  sessionStartAddressId,
  sessionStartCarrierId,
  onRevertSession,
  onConfirmShipTo,
  onConfirmCarrier,
  onAddressRecordUpdated,
}: EditShipmentDetailsModalProps) {
  const [modalView, setModalView] = useState<ShipToModalView>('SELECT_SHIP_TO');
  const [editingLocation, setEditingLocation] = useState<Address | null>(null);
  const [locationForm, setLocationForm] = useState<LocationFormValues>(
    emptyLocationForm
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<{
    title: string;
    description?: string;
    undo?: () => void;
  } | null>(null);
  const [addressBookMutated, setAddressBookMutated] = useState(false);
  const [highlightedAddressId, setHighlightedAddressId] = useState<
    string | null
  >(null);
  const [showFormValidationErrors, setShowFormValidationErrors] =
    useState(false);
  const [defaultShipToId, setDefaultShipToIdState] = useState(
    currentUser.defaultShipToId
  );

  const canDeleteAddress = addresses.length > 1;
  const isSelectView = modalView === 'SELECT_SHIP_TO';
  const isEditView = modalView === 'EDIT_LOCATION';
  const isAddView = modalView === 'ADD_LOCATION';
  const isFormView = isAddView || isEditView;

  const matchedAddress = useAddressDeduplication(
    locationForm.street,
    locationForm.postalCode,
    addresses,
    isEditView ? editingLocation?.id : null
  );

  const formValid = isLocationFormValid(locationForm);

  const resetToSelect = useCallback(() => {
    setModalView('SELECT_SHIP_TO');
    setEditingLocation(null);
    setLocationForm(emptyLocationForm());
    setPendingDeleteId(null);
    setShowFormValidationErrors(false);
  }, []);

  const cancelFormView = () => {
    setEditingLocation(null);
    setLocationForm(emptyLocationForm());
    setPendingDeleteId(null);
    setShowFormValidationErrors(false);
    setModalView('SELECT_SHIP_TO');
  };

  useEffect(() => {
    if (!addressFeedback) return;
    const timer = window.setTimeout(() => setAddressFeedback(null), 4500);
    return () => window.clearTimeout(timer);
  }, [addressFeedback]);

  useEffect(() => {
    if (!highlightedAddressId) return;
    const timer = window.setTimeout(() => setHighlightedAddressId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [highlightedAddressId]);

  useEffect(() => {
    const el = dialogEl();
    if (!el) return;
    const onDialogClose = () => {
      resetToSelect();
      setAddressFeedback(null);
      setHighlightedAddressId(null);
      setAddressBookMutated(false);
    };
    el.addEventListener('close', onDialogClose);
    return () => el.removeEventListener('close', onDialogClose);
  }, [resetToSelect]);

  const openEditLocation = (address: Address) => {
    setPendingDeleteId(null);
    setEditingLocation(address);
    setLocationForm(
      locationFormFromAddress(address, address.id === defaultShipToId)
    );
    setShowFormValidationErrors(false);
    setModalView('EDIT_LOCATION');
  };

  const openAddLocation = () => {
    setPendingDeleteId(null);
    setEditingLocation(null);
    setLocationForm(emptyLocationForm({ setAsDefault: false }));
    setShowFormValidationErrors(false);
    setModalView('ADD_LOCATION');
  };

  const applyProfileDefault = (addressId: string, setAsDefault: boolean) => {
    if (setAsDefault) {
      setDefaultShipToId(addressId);
      setDefaultShipToIdState(addressId);
      return;
    }
    if (defaultShipToId === addressId) {
      const fallback =
        addresses.find((item) => item.id !== addressId)?.id ?? addressId;
      setDefaultShipToId(fallback);
      setDefaultShipToIdState(fallback);
    }
  };

  const buildAddressFromForm = (
    base: Partial<Address> & { id: string }
  ): Address => ({
    id: base.id,
    nickname: locationForm.nickname.trim(),
    category: locationForm.category,
    street: locationForm.street.trim(),
    streetLine2: locationForm.addressLine2.trim() || undefined,
    city: locationForm.city.trim(),
    state: locationForm.state.trim(),
    postalCode: locationForm.postalCode.trim(),
    country: locationForm.country,
    phone: base.phone ?? '(408) 555-0100',
  });

  const saveEditedLocation = () => {
    if (!editingLocation || !formValid) return;

    const updated = buildAddressFromForm(editingLocation);

    onAddressesChange(
      addresses.map((item) => (item.id === updated.id ? updated : item))
    );
    applyProfileDefault(updated.id, locationForm.setAsDefault);
    onAddressRecordUpdated(editingLocation.id, updated);
    setAddressFeedback({
      title: `'${updated.nickname}' was saved to your account addresses.`,
    });
    setAddressBookMutated(true);
    resetToSelect();
  };

  const saveNewLocation = () => {
    if (!formValid) return;

    const id = `custom-${Date.now()}`;
    const next = buildAddressFromForm({ id });

    onAddressesChange(
      locationForm.setAsDefault ? [next, ...addresses] : [...addresses, next]
    );
    applyProfileDefault(next.id, locationForm.setAsDefault);
    onDraftAddressIdChange(next.id);
    setAddressFeedback({
      title: `'${next.nickname}' saved to account and selected`,
    });
    setAddressBookMutated(true);
    setHighlightedAddressId(next.id);
    resetToSelect();
  };

  const submitFormView = (options?: { forceDuplicate?: boolean }) => {
    if (!formValid) {
      setShowFormValidationErrors(true);
      return;
    }
    setShowFormValidationErrors(false);
    if (matchedAddress && !options?.forceDuplicate) return;
    if (isAddView) saveNewLocation();
    else if (isEditView) saveEditedLocation();
  };

  const useExistingLocation = (matched: Address) => {
    onDraftAddressIdChange(matched.id);
    setAddressFeedback({
      title: 'Using existing location',
      description: `"${matched.nickname}" is selected for this shipment.`,
    });
    setHighlightedAddressId(matched.id);
    resetToSelect();
  };

  const requestDeleteAddress = (id: string) => {
    if (addresses.length <= 1) return;
    setPendingDeleteId(id);
  };

  const deleteAddress = (id: string) => {
    if (addresses.length <= 1) return;
    const removedIndex = addresses.findIndex((item) => item.id === id);
    if (removedIndex < 0) return;

    const removed = addresses[removedIndex];
    if (!removed) return;
    const removedLabel = removed.nickname;
    const remaining = addresses.filter((item) => item.id !== id);
    const fallback =
      remaining[Math.min(removedIndex, remaining.length - 1)] ?? remaining[0];
    if (!fallback) return;

    onAddressesChange(remaining);
    if (draftAddressId === id) onDraftAddressIdChange(fallback.id);
    if (defaultShipToId === id) {
      setDefaultShipToId(fallback.id);
      setDefaultShipToIdState(fallback.id);
    }
    onAddressRecordUpdated(id, fallback);
    setPendingDeleteId(null);
    setAddressBookMutated(true);
    setAddressFeedback({
      title: `Address deleted: '${removedLabel}' was removed from your saved account addresses.`,
      undo: () => {
        const restored = [...remaining];
        restored.splice(removedIndex, 0, removed);
        onAddressesChange(restored);
        onDraftAddressIdChange(removed.id);
        onAddressRecordUpdated(fallback.id, removed);
        setAddressFeedback({
          title: `'${removedLabel}' was restored to your saved account addresses.`,
        });
      },
    });
  };

  const dismissModal = (revertSelection: boolean) => {
    if (revertSelection) {
      onRevertSession();
    }
    closeModal();
  };

  const selectionChanged =
    draftAddressId !== sessionStartAddressId ||
    draftCarrierId !== sessionStartCarrierId;

  const selectSecondaryLabel = addressBookMutated
    ? selectionChanged
      ? 'Keep selection'
      : 'Close'
    : 'Cancel';
  const selectSecondaryRevert = !addressBookMutated;

  const closeModal = () => {
    dialogEl()?.close();
  };

  const formHeaderTitle = isAddView
    ? 'Add new location'
    : 'Edit shipping location';

  return (
    <ModusWcModal
      modalId={EDIT_SHIPMENT_DETAILS_MODAL_ID}
      customClass="shipment-edit-modal shipment-ship-to-modal shipment-details-modal modus-mobile-fullscreen-modal"
      backdrop="default"
      position="center"
      showClose
      aria-label={isFormView ? formHeaderTitle : 'Edit shipping details'}
    >
      <div slot="header" className="edit-shipment-modal-header">
        <div
          className={`edit-shipment-form-header${!isFormView ? ' edit-shipment-panel--hidden' : ''}`}
          hidden={!isFormView}
          aria-hidden={!isFormView}
        >
          <ModusWcButton
            color="tertiary"
            variant="borderless"
            size="sm"
            shape="square"
            customClass="edit-shipment-back-btn"
            aria-label="Back to shipping locations"
            onButtonClick={resetToSelect}
          >
            <ModusWcIcon name="arrow_back" size="sm" decorative />
          </ModusWcButton>
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label={formHeaderTitle}
          />
        </div>
        <div
          className={isFormView ? 'edit-shipment-panel--hidden' : undefined}
          hidden={isFormView}
          aria-hidden={isFormView}
        >
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label="Edit shipping details"
          />
        </div>
      </div>

      <div
        slot="content"
        className="shipment-edit-modal-content flex min-w-0 flex-col gap-5"
      >
        <section
          className={`edit-shipment-select-view flex flex-col gap-2${!isSelectView ? ' edit-shipment-panel--hidden' : ''}`}
          aria-label="Shipping to"
          hidden={!isSelectView}
          aria-hidden={!isSelectView}
        >
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              weight="semibold"
              label="Shipping to"
            />
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label="Choose where this shipment should be delivered."
            />
            <div
              className="shipment-address-feedback"
              hidden={!addressFeedback}
              aria-hidden={!addressFeedback}
            >
              {addressFeedback ? (
                <ModusWcAlert
                  variant="success"
                  dismissible
                  onDismissClick={() => setAddressFeedback(null)}
                  alertTitle={addressFeedback.title}
                  alertDescription={addressFeedback.description}
                  customClass="shipment-address-feedback-alert"
                >
                  {addressFeedback.undo ? (
                    <div slot="content" className="shipment-address-feedback-actions">
                      <ModusWcButton
                        color="tertiary"
                        variant="borderless"
                        size="sm"
                        aria-label="Undo address deletion"
                        onButtonClick={() => {
                          addressFeedback.undo?.();
                          setAddressBookMutated(true);
                        }}
                      >
                        <ModusWcIcon name="undo" size="xs" decorative />
                        Undo
                      </ModusWcButton>
                    </div>
                  ) : null}
                </ModusWcAlert>
              ) : null}
            </div>
            <ul className="shipment-edit-radio-list">
              {addresses.map((item, index) => {
                const isPendingDelete = pendingDeleteId === item.id;
                const isHighlighted = highlightedAddressId === item.id;

                return (
                  <li
                    key={item.id}
                    className={
                      isHighlighted
                        ? 'shipment-address-row shipment-address-row--highlight'
                        : 'shipment-address-row'
                    }
                  >
                    {index > 0 ? <ModusWcDivider /> : null}

                    <div
                      className="shipment-edit-radio-row"
                      hidden={isPendingDelete}
                      aria-hidden={isPendingDelete}
                    >
                      <ModusWcRadio
                        size="sm"
                        name="fulfillment-ship-to"
                        label={formatShipToRadioLabel(item)}
                        value={draftAddressId === item.id}
                        onInputChange={(e: CustomEvent) => {
                          if (readInputChecked(e)) {
                            onDraftAddressIdChange(item.id);
                          }
                        }}
                      />
                      <div className="shipment-edit-radio-actions">
                        <ModusWcDropdownMenu
                          buttonAriaLabel={`More actions for ${item.nickname}`}
                          buttonColor="tertiary"
                          buttonVariant="borderless"
                          buttonShape="square"
                          buttonSize="sm"
                          menuPlacement="bottom-end"
                          menuSize="sm"
                          menuStrategy="fixed"
                          menuOffset={8}
                        >
                          <div slot="button">
                            <ModusWcIcon
                              name="more_vertical"
                              size="xs"
                              decorative
                            />
                          </div>
                          <div slot="menu">
                            <ModusWcMenuItem
                              size="sm"
                              label="Edit address"
                              value="edit"
                              onItemSelect={(e: CustomEvent) => {
                                closeDropdownMenu(e);
                                openEditLocation(item);
                              }}
                            >
                              <ModusWcIcon
                                slot="start-icon"
                                name="pencil"
                                size="sm"
                                decorative
                              />
                            </ModusWcMenuItem>
                            <ModusWcMenuItem
                              size="sm"
                              label="Delete address"
                              value="delete"
                              disabled={!canDeleteAddress}
                              onItemSelect={(e: CustomEvent) => {
                                closeDropdownMenu(e);
                                requestDeleteAddress(item.id);
                              }}
                            >
                              <span
                                slot="start-icon"
                                className="shipment-address-menu-delete-icon"
                              >
                                <ModusWcIcon
                                  name="delete"
                                  size="sm"
                                  decorative
                                />
                              </span>
                            </ModusWcMenuItem>
                          </div>
                        </ModusWcDropdownMenu>
                      </div>
                    </div>

                    <div
                      className="shipment-delete-confirm"
                      role="group"
                      aria-label={`Confirm delete ${item.nickname}`}
                      hidden={!isPendingDelete}
                      aria-hidden={!isPendingDelete}
                    >
                      <span
                        className="shipment-delete-confirm-icon"
                        aria-hidden="true"
                      >
                        <ModusWcIcon name="warning" size="sm" decorative />
                      </span>
                      <ModusWcTypography
                        hierarchy="p"
                        size="sm"
                        customClass="shipment-delete-confirm-copy"
                        label={`Delete "${item.nickname}"? This will remove it from your saved account addresses.`}
                      />
                      <div className="shipment-delete-confirm-actions">
                        <ModusWcButton
                          color="tertiary"
                          variant="outlined"
                          size="sm"
                          onButtonClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </ModusWcButton>
                        <ModusWcButton
                          color="danger"
                          variant="filled"
                          size="sm"
                          onButtonClick={() => deleteAddress(item.id)}
                        >
                          <ModusWcIcon name="delete" size="xs" decorative />
                          Yes, Delete Location
                        </ModusWcButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="shipment-add-location-trigger">
              <ModusWcButton
                className="cart-text-link-host"
                color="primary"
                variant="borderless"
                size="sm"
                customClass="cart-text-link"
                aria-label="Add new location"
                onButtonClick={openAddLocation}
              >
                <ModusWcIcon name="add" size="xs" decorative />
                Add new location
              </ModusWcButton>
            </div>

            <div className="edit-shipment-carrier-section flex flex-col gap-2">
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                weight="semibold"
                label="Carrier"
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label="Select the carrier account for this shipment."
              />
              <ul
                className="shipment-edit-radio-list"
                aria-label="Carrier options"
              >
                {SHIPPING_OPTIONS.map((opt, index) => (
                  <li key={opt.id}>
                    {index > 0 ? <ModusWcDivider /> : null}
                    <div className="shipment-edit-radio-row">
                      <ModusWcRadio
                        size="sm"
                        name="fulfillment-carrier-edit"
                        label={`${opt.carrier} · ${opt.accountNumber}`}
                        value={draftCarrierId === opt.id}
                        onInputChange={(e: CustomEvent) => {
                          if (readInputChecked(e)) {
                            onDraftCarrierIdChange(opt.id);
                          }
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
        </section>

        <div
          className={`edit-shipment-form-view min-w-0 flex flex-col gap-4${!isFormView ? ' edit-shipment-panel--hidden' : ''}`}
          hidden={!isFormView}
          aria-hidden={!isFormView}
        >
          <EditLocationForm
            mode={isAddView ? 'add' : 'edit'}
            form={locationForm}
            onChange={setLocationForm}
            savedAddresses={addresses}
            excludeAddressId={editingLocation?.id ?? null}
            showValidationErrors={showFormValidationErrors}
            onUseExisting={useExistingLocation}
            onSaveAnyway={() => submitFormView({ forceDuplicate: true })}
          />
        </div>
      </div>

      <div
        slot="footer"
        className={`edit-shipment-modal-footer flex justify-end gap-2${!isSelectView ? ' edit-shipment-panel--hidden' : ''}`}
        hidden={!isSelectView}
        aria-hidden={!isSelectView}
      >
        <ModusWcButton
          variant="outlined"
          color="tertiary"
          size="sm"
          onButtonClick={() => dismissModal(selectSecondaryRevert)}
        >
          {selectSecondaryLabel}
        </ModusWcButton>
        <ModusWcButton
          variant="filled"
          color="primary"
          size="sm"
          onButtonClick={() => {
            onConfirmShipTo();
            onConfirmCarrier();
            closeModal();
          }}
        >
          <ModusWcIcon name="check" size="xs" decorative />
          Save changes
        </ModusWcButton>
      </div>

      <div
        slot="footer"
        className={`edit-shipment-modal-footer flex justify-end gap-2${!isFormView ? ' edit-shipment-panel--hidden' : ''}`}
        hidden={!isFormView}
        aria-hidden={!isFormView}
      >
        <ModusWcButton
          variant="outlined"
          color="tertiary"
          size="sm"
          onButtonClick={cancelFormView}
        >
          Cancel
        </ModusWcButton>
        <ModusWcButton
          variant="filled"
          color="primary"
          size="sm"
          onButtonClick={() => submitFormView()}
        >
          <ModusWcIcon
            name={isAddView ? 'add' : 'check'}
            size="xs"
            decorative
          />
          {isAddView ? 'Save & Select' : 'Save'}
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}

export function openEditShipmentDetailsModal() {
  dialogEl()?.showModal();
}

/** @deprecated Use openEditShipmentDetailsModal */
export function openEditShipToModal() {
  openEditShipmentDetailsModal();
}

/** @deprecated Use EDIT_SHIPMENT_DETAILS_MODAL_ID */
export const EDIT_SHIPMENT_MODAL_ID = EDIT_SHIPMENT_DETAILS_MODAL_ID;
