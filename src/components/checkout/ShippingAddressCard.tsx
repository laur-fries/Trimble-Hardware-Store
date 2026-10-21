import { useEffect, useMemo, useState } from 'react';
import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcModal,
  ModusWcRadio,
  ModusWcSelect,
  ModusWcTextInput,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { ISelectOption } from '@trimble-oss/moduswebcomponents';
import type { CartLine } from '../../cart/CartContext';
import {
  SHIPPING_ADDRESSES,
  formatAddressLine,
  getAddressById,
  type ShippingAddress,
} from '../../checkout/checkoutData';
import {
  buildDefaultAddressMap,
  formatShipToOptionLabel,
  groupShipmentsByAddress,
} from '../../checkout/shipments';
import { readInputChecked, readInputString } from '../../utils/modusFormEvents';

export const ADDRESS_SELECTOR_MODAL_ID = 'checkout-address-selector-modal';
const ADD_NEW_ADDRESS_VALUE = '__add_new_shipping_location__';

const dialog = () =>
  document.getElementById(ADDRESS_SELECTOR_MODAL_ID) as HTMLDialogElement | null;

export const openAddressSelectorModal = () => dialog()?.showModal();
export const closeAddressSelectorModal = () => dialog()?.close();

export interface ShippingAddressCardProps {
  shippingAddress: ShippingAddress;
  lines: CartLine[];
  /** Per–line-item ship-to mapping (State B). */
  addressMap: Record<string, ShippingAddress>;
  onShippingAddressChange: (address: ShippingAddress) => void;
  onAddressMapChange: (map: Record<string, ShippingAddress>) => void;
  onLineShipToChange: (productId: string, address: ShippingAddress) => void;
  onMultiShipChange?: (isMultiShip: boolean) => void;
  onCustomAddressAdded?: (address: ShippingAddress) => void;
}

/**
 * Checkout shipping: State A (single destination) vs State B (per-line multi-ship)
 * with a live shipment-grouping preview. Views stay mutually exclusive via stable
 * mounted trees + [hidden] (never remount title-slot actions).
 */
export default function ShippingAddressCard({
  shippingAddress,
  lines,
  addressMap,
  onShippingAddressChange,
  onAddressMapChange,
  onLineShipToChange,
  onMultiShipChange,
  onCustomAddressAdded,
}: ShippingAddressCardProps) {
  const [isMultiShip, setIsMultiShip] = useState(false);
  const [draftId, setDraftId] = useState(shippingAddress.id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLine1, setNewLine1] = useState('');
  const [customAddresses, setCustomAddresses] = useState<ShippingAddress[]>([]);
  const [pickerContext, setPickerContext] = useState<
    'default' | { productId: string }
  >('default');

  const setMultiShip = (next: boolean) => {
    setIsMultiShip(next);
    onMultiShipChange?.(next);
  };

  useEffect(() => {
    setDraftId(shippingAddress.id);
  }, [shippingAddress.id]);

  const allAddresses = useMemo(
    () => [...SHIPPING_ADDRESSES, ...customAddresses],
    [customAddresses]
  );

  const addressOptions: ISelectOption[] = useMemo(
    () => [
      ...allAddresses.map((a) => ({
        value: a.id,
        label: formatShipToOptionLabel(a),
      })),
      {
        value: ADD_NEW_ADDRESS_VALUE,
        label: '+ Add new shipping location',
      },
    ],
    [allAddresses]
  );

  const shipmentGroups = useMemo(
    () => groupShipmentsByAddress(lines, addressMap, shippingAddress),
    [lines, addressMap, shippingAddress]
  );

  const resolveAddress = (id: string): ShippingAddress =>
    allAddresses.find((item) => item.id === id) ??
    getAddressById(id) ??
    SHIPPING_ADDRESSES[0];

  const openModal = (
    context: 'default' | { productId: string } = 'default'
  ) => {
    setPickerContext(context);
    if (context === 'default') {
      setDraftId(shippingAddress.id);
    } else {
      setDraftId(addressMap[context.productId]?.id ?? shippingAddress.id);
    }
    setShowAddForm(false);
    openAddressSelectorModal();
  };

  const confirm = () => {
    const selected = resolveAddress(draftId);
    if (pickerContext === 'default') {
      onShippingAddressChange(selected);
      if (!isMultiShip) {
        onAddressMapChange(buildDefaultAddressMap(lines, selected));
      }
    } else {
      onLineShipToChange(pickerContext.productId, selected);
    }
    closeAddressSelectorModal();
  };

  const addAddress = () => {
    if (!newLabel.trim() || !newLine1.trim()) return;
    const id = `custom-${Date.now()}`;
    const next: ShippingAddress = {
      id,
      nickname: newLabel.trim(),
      category: 'customer_drop_ship',
      street: newLine1.trim(),
      city: 'Sunnyvale',
      state: 'CA',
      postalCode: '94085',
      country: 'US',
      phone: '(408) 555-0100',
    };
    setCustomAddresses((prev) => [...prev, next]);
    onCustomAddressAdded?.(next);
    setDraftId(id);
    setNewLabel('');
    setNewLine1('');
    setShowAddForm(false);
  };

  const handleLineSelect = (productId: string, value: string) => {
    if (value === ADD_NEW_ADDRESS_VALUE) {
      openModal({ productId });
      setShowAddForm(true);
      return;
    }
    onLineShipToChange(productId, resolveAddress(value));
  };

  const enableMultiShip = () => {
    onAddressMapChange(buildDefaultAddressMap(lines, shippingAddress));
    setMultiShip(true);
  };

  const revertToSingleAddress = () => {
    onAddressMapChange(buildDefaultAddressMap(lines, shippingAddress));
    setMultiShip(false);
  };

  return (
    <>
      <ModusWcCard
        bordered={true}
        padding="compact"
        customClass="shipping-address-card"
      >
        <div
          slot="title"
          className="flex w-full min-w-0 items-center justify-between gap-3"
        >
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label={isMultiShip ? 'Shipping Destinations' : 'Shipping address'}
          />

          {/* Keep both title action sets mounted — toggle with hidden only */}
          <div className="flex shrink-0 items-center justify-end">
            <div
              className="shipping-address-title-actions"
              hidden={isMultiShip}
              aria-hidden={isMultiShip}
            >
              <ModusWcButton
                className="cart-text-link-host"
                color="primary"
                variant="borderless"
                size="sm"
                customClass="cart-text-link"
                aria-label="Split items across multiple locations"
                onButtonClick={enableMultiShip}
              >
                Split items across multiple locations
              </ModusWcButton>
              <span
                className="shipping-address-title-divider"
                aria-hidden="true"
              />
              <ModusWcButton
                className="cart-text-link-host"
                color="primary"
                variant="borderless"
                size="sm"
                customClass="cart-text-link"
                aria-label="Change shipping address"
                onButtonClick={() => openModal('default')}
              >
                Change address
              </ModusWcButton>
            </div>
            <div hidden={!isMultiShip} aria-hidden={!isMultiShip}>
              <ModusWcButton
                className="cart-text-link-host"
                color="primary"
                variant="borderless"
                size="sm"
                customClass="cart-text-link"
                aria-label="Revert to single address"
                onButtonClick={revertToSingleAddress}
              >
                <ModusWcIcon name="undo" size="xs" decorative />
                Revert to single address
              </ModusWcButton>
            </div>
          </div>
        </div>

        <div className="shipping-address-card-inner flex flex-col gap-4 px-1 pb-1 pt-2">
          {/* State A — single destination (no per-line dropdowns) */}
          <div
            className="shipping-address-state flex flex-col gap-4"
            hidden={isMultiShip}
            aria-hidden={isMultiShip}
          >
            <ModusWcAlert
              variant="info"
              icon="info"
              alertDescription="All items in this order will ship to the address listed below."
              role="status"
            />

            <div className="flex flex-col gap-0.5">
              <ModusWcTypography
                hierarchy="p"
                size="md"
                weight="semibold"
                label={shippingAddress.nickname}
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label={shippingAddress.street}
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label={`${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`}
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label={shippingAddress.phone}
              />
            </div>
          </div>

          {/* State B — per-line destinations + shipment grouping preview */}
          <div
            className="shipping-address-state flex flex-col gap-4"
            hidden={!isMultiShip}
            aria-hidden={!isMultiShip}
          >
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label="Assign destination warehouses for each line item in this transaction."
            />

            <ul
              className="flex flex-col gap-3"
              aria-label="Line item shipping destinations"
            >
              {lines.map((line) => {
                const productId = line.product.id;
                const selected = addressMap[productId] ?? shippingAddress;

                return (
                  <li
                    key={productId}
                    className="shipping-line-card flex flex-col gap-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="cart-thumb shrink-0" aria-hidden="true">
                        <img
                          src={line.product.image}
                          alt=""
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <ModusWcTypography
                          hierarchy="p"
                          size="xs"
                          customClass="font-mono text-[var(--modus-wc-color-base-content-low-contrast)]"
                          label={`PN: ${line.product.partNumber}`}
                        />
                        <ModusWcTypography
                          hierarchy="p"
                          size="sm"
                          weight="semibold"
                          label={line.product.name}
                        />
                        <ModusWcTypography
                          hierarchy="p"
                          size="xs"
                          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                          label={`Qty: ${line.quantity}`}
                        />
                      </div>
                    </div>

                    {/* Selects stay mounted but disabled when State A is active
                        so Modus does not project open pickers through [hidden]. */}
                    <ModusWcSelect
                      label="Ship-To Address"
                      size="sm"
                      options={addressOptions}
                      value={selected.id}
                      disabled={!isMultiShip}
                      onInputChange={(e: CustomEvent) =>
                        handleLineSelect(productId, readInputString(e))
                      }
                    />
                  </li>
                );
              })}
            </ul>

            <section
              className="shipment-grouping-preview"
              aria-label="Shipment grouping preview"
            >
              <ModusWcTypography
                hierarchy="h3"
                size="sm"
                weight="semibold"
                label="Shipment grouping preview"
              />
              <ModusWcTypography
                hierarchy="p"
                size="xs"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label={`${shipmentGroups.length} ${
                  shipmentGroups.length === 1 ? 'shipment' : 'shipments'
                } will be created from the destinations below.`}
              />

              <ul className="flex flex-col gap-2">
                {shipmentGroups.map((group, index) => (
                  <li key={group.address.id} className="shipment-preview-card">
                    <div className="flex items-start gap-2">
                      <ModusWcIcon name="package" size="sm" decorative />
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <ModusWcTypography
                          hierarchy="p"
                          size="sm"
                          weight="semibold"
                          label={`Shipment ${index + 1} to ${group.address.nickname}`}
                        />
                        <ModusWcTypography
                          hierarchy="p"
                          size="xs"
                          customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                          label={formatAddressLine(group.address)}
                        />
                        <ul className="mt-1 flex flex-col gap-0.5">
                          {group.items.map((item) => (
                            <li key={`${group.address.id}-${item.productId}`}>
                              <ModusWcTypography
                                hierarchy="p"
                                size="xs"
                                label={`${item.title} · PN ${item.partNumber} · Qty ${item.quantity}`}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </ModusWcCard>

      <ModusWcModal
        modalId={ADDRESS_SELECTOR_MODAL_ID}
        backdrop="default"
        position="center"
        showClose
        aria-label="Select shipping address"
      >
        <div slot="header">
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label="Select shipping address"
          />
        </div>

        <div slot="content" className="flex min-w-0 flex-col gap-3">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label="Choose a saved dealership warehouse or add a new ship-to destination."
          />

          <div className="flex flex-col gap-2">
            {allAddresses.map((item) => (
              <div key={item.id} className="shipping-line-card p-3">
                <ModusWcRadio
                  name="checkout-ship-to"
                  label={`${formatShipToOptionLabel(item)} — ${item.street}`}
                  value={draftId === item.id}
                  onInputChange={(e: CustomEvent) => {
                    if (readInputChecked(e)) setDraftId(item.id);
                  }}
                />
              </div>
            ))}
          </div>

          <div
            className={
              showAddForm
                ? 'shipment-add-location-form flex flex-col gap-2'
                : 'shipment-add-location-form'
            }
            hidden={!showAddForm}
            aria-hidden={!showAddForm}
          >
            <ModusWcTextInput
              label="Location label"
              placeholder="e.g. Jobsite — Bay Bridge"
              value={newLabel}
              onInputChange={(e: CustomEvent) =>
                setNewLabel(readInputString(e))
              }
            />
            <ModusWcTextInput
              label="Street address"
              placeholder="Street, city, state, ZIP"
              value={newLine1}
              onInputChange={(e: CustomEvent) =>
                setNewLine1(readInputString(e))
              }
            />
            <ModusWcButton
              color="tertiary"
              variant="outlined"
              size="sm"
              aria-label="Save new shipping address"
              disabled={!newLabel.trim() || !newLine1.trim()}
              onButtonClick={addAddress}
            >
              Save address
            </ModusWcButton>
          </div>

          <div
            className="shipment-add-location-trigger"
            hidden={showAddForm}
            aria-hidden={showAddForm}
          >
            <ModusWcButton
              className="cart-text-link-host"
              color="primary"
              variant="borderless"
              size="sm"
              customClass="cart-text-link"
              aria-label="Add a new shipping address"
              onButtonClick={() => setShowAddForm(true)}
            >
              + Add new shipping location
            </ModusWcButton>
          </div>
        </div>

        <div slot="footer" className="flex justify-end gap-2">
          <ModusWcButton
            variant="outlined"
            color="tertiary"
            size="sm"
            aria-label="Cancel address change"
            onButtonClick={closeAddressSelectorModal}
          >
            Cancel
          </ModusWcButton>
          <ModusWcButton
            variant="filled"
            color="primary"
            size="sm"
            aria-label="Use selected shipping address"
            onButtonClick={confirm}
          >
            <ModusWcIcon name="check" size="xs" decorative />
            Use this address
          </ModusWcButton>
        </div>
      </ModusWcModal>
    </>
  );
}
