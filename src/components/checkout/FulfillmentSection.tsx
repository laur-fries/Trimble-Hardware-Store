import { useEffect, useMemo, useState } from 'react';
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcDate,
  ModusWcIcon,
  ModusWcRadio,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { ISelectOption } from '@trimble-oss/moduswebcomponents';
import type { CartLine } from '../../cart/CartContext';
import {
  SHIPPING_ADDRESSES,
  SHIPPING_OPTIONS,
  formatCarrierDisplay,
  getAddressById,
  getShippingOptionById,
  type Address,
  type ShippingAddress,
} from '../../checkout/checkoutData';
import { buildDefaultAddressMap } from '../../checkout/shipments';
import {
  requestedShipDateBounds,
  type FulfillmentPreference,
} from '../../checkout/fulfillmentPreferences';
import { readInputChecked, readInputString } from '../../utils/modusFormEvents';
import EditShipmentDetailsModal, {
  openEditShipmentDetailsModal,
} from './EditShipmentDetailsModal';
import MultiShipAllocation from './MultiShipAllocation';

export interface FulfillmentSectionProps {
  lines: CartLine[];
  shippingAddress: ShippingAddress;
  addressMap: Record<string, ShippingAddress>;
  shippingOptionId: string;
  isMultiShip: boolean;
  onMultiShipChange: (next: boolean) => void;
  onShippingAddressChange: (address: ShippingAddress) => void;
  onAddressMapChange: (map: Record<string, ShippingAddress>) => void;
  onLineShipToChange: (productId: string, address: ShippingAddress) => void;
  onShippingOptionChange: (id: string) => void;
  fulfillmentPreference: FulfillmentPreference;
  onFulfillmentPreferenceChange: (value: FulfillmentPreference) => void;
  requestedShipDate: string;
  onRequestedShipDateChange: (value: string) => void;
  multiShipAssignmentError?: string | null;
}

function FieldLabel({ label }: { label: string }) {
  return (
    <ModusWcTypography
      hierarchy="p"
      size="xs"
      customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
      label={label}
    />
  );
}

export default function FulfillmentSection({
  lines,
  shippingAddress,
  addressMap,
  shippingOptionId,
  isMultiShip,
  onMultiShipChange,
  onShippingAddressChange,
  onAddressMapChange,
  onShippingOptionChange,
  fulfillmentPreference,
  onFulfillmentPreferenceChange,
  requestedShipDate,
  onRequestedShipDateChange,
  multiShipAssignmentError = null,
}: FulfillmentSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>(() => [
    ...SHIPPING_ADDRESSES,
  ]);
  const [draftAddressId, setDraftAddressId] = useState(shippingAddress.id);
  const [draftCarrierId, setDraftCarrierId] = useState(shippingOptionId);
  const [bulkAddressId, setBulkAddressId] = useState(shippingAddress.id);
  const [modalSession, setModalSession] = useState({
    addressId: shippingAddress.id,
    carrierId: shippingOptionId,
  });

  const shipDateBounds = useMemo(() => requestedShipDateBounds(), []);

  const bulkOptions: ISelectOption[] = useMemo(
    () =>
      addresses.map((a) => ({
        value: a.id,
        label: `${a.nickname} - ${a.street} ${a.city}, ${a.state}`,
      })),
    [addresses]
  );

  const shippingOption =
    getShippingOptionById(shippingOptionId) ?? SHIPPING_OPTIONS[0];
  const carrierDisplay = formatCarrierDisplay(shippingOption);

  const resolveAddress = (id: string): Address =>
    addresses.find((item) => item.id === id) ??
    getAddressById(id) ??
    addresses[0] ??
    SHIPPING_ADDRESSES[0];

  useEffect(() => {
    setDraftAddressId(shippingAddress.id);
    setBulkAddressId(shippingAddress.id);
  }, [shippingAddress.id]);

  useEffect(() => {
    setDraftCarrierId(shippingOptionId);
  }, [shippingOptionId]);

  const setMode = (multi: boolean) => {
    if (multi) {
      onAddressMapChange({});
      onMultiShipChange(true);
      return;
    }
    onAddressMapChange(buildDefaultAddressMap(lines, shippingAddress));
    onMultiShipChange(false);
  };

  const openEditShipmentDetails = () => {
    const snap = {
      addressId: shippingAddress.id,
      carrierId: shippingOptionId,
    };
    setModalSession(snap);
    setDraftAddressId(snap.addressId);
    setDraftCarrierId(snap.carrierId);
    openEditShipmentDetailsModal();
  };

  const revertModalSession = () => {
    setDraftAddressId(modalSession.addressId);
    setDraftCarrierId(modalSession.carrierId);
  };

  const confirmShipTo = () => {
    const selected = resolveAddress(draftAddressId);
    onShippingAddressChange(selected);
    if (!isMultiShip) {
      onAddressMapChange(buildDefaultAddressMap(lines, selected));
    }
  };

  const confirmCarrier = () => {
    onShippingOptionChange(draftCarrierId);
  };

  const remapLinesFromAddress = (
    addressId: string,
    nextAddress: ShippingAddress
  ) => {
    let changed = false;
    const nextMap: Record<string, ShippingAddress> = { ...addressMap };
    for (const line of lines) {
      const productId = line.product.id;
      if (nextMap[productId]?.id === addressId) {
        nextMap[productId] = nextAddress;
        changed = true;
      }
    }
    if (changed) onAddressMapChange(nextMap);
    if (shippingAddress.id === addressId || draftAddressId === addressId) {
      onShippingAddressChange(nextAddress);
    }
  };

  return (
    <div className="fulfillment-section">
      <ModusWcCard
        bordered={true}
        padding="compact"
        customClass="fulfillment-section-card"
      >
        <div slot="title">
          <ModusWcTypography
            hierarchy="h2"
            size="lg"
            weight="semibold"
            label="Shipping"
          />
        </div>

        <div className="flex flex-col gap-4 px-1 pb-1 pt-2">
          <fieldset className="fulfillment-mode-toggle">
            <legend className="sr-only">Shipping mode</legend>
            <ModusWcRadio
              name="fulfillment-mode"
              label="Ship all items to the same location"
              value={!isMultiShip}
              onInputChange={(e: CustomEvent) => {
                if (readInputChecked(e)) setMode(false);
              }}
            />
            <ModusWcRadio
              name="fulfillment-mode"
              label="Ship across multiple locations"
              value={isMultiShip}
              onInputChange={(e: CustomEvent) => {
                if (readInputChecked(e)) setMode(true);
              }}
            />
          </fieldset>

          <div
            className="fulfillment-state flex flex-col gap-3"
            hidden={isMultiShip}
            aria-hidden={isMultiShip}
          >
            <div className="fulfillment-primary-shipment">
              <div className="fulfillment-shipment-details-header">
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  weight="semibold"
                  label="Shipment details"
                />
                <ModusWcButton
                  color="primary"
                  variant="borderless"
                  size="sm"
                  customClass="fulfillment-shipment-edit-btn"
                  aria-label="Edit shipment details"
                  onButtonClick={openEditShipmentDetails}
                >
                  <ModusWcIcon name="pencil" size="xs" decorative />
                  Edit
                </ModusWcButton>
              </div>

              <div className="fulfillment-shipment-details-grid">
                <div className="flex flex-col gap-1">
                  <FieldLabel label="Shipping to" />
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
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
                  <div className="pt-1">
                    <ModusWcTypography
                      hierarchy="p"
                      size="xs"
                      customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                      label="Account number"
                    />
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      weight="semibold"
                      label={shippingOption.accountNumber}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <FieldLabel label="Carrier" />
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    weight="semibold"
                    label={carrierDisplay.title}
                  />
                  {carrierDisplay.subtitle ? (
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                      label={carrierDisplay.subtitle}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div
            className="fulfillment-state"
            hidden={!isMultiShip}
            aria-hidden={!isMultiShip}
          >
            <MultiShipAllocation
              lines={lines}
              addressMap={addressMap}
              shippingAddress={shippingAddress}
              warehouses={addresses}
              bulkOptions={bulkOptions}
              bulkAddressId={bulkAddressId}
              onBulkAddressIdChange={setBulkAddressId}
              onAddressMapChange={onAddressMapChange}
              resolveAddress={resolveAddress}
              onEditShipTo={openEditShipmentDetails}
              assignmentError={multiShipAssignmentError}
            />
          </div>

          <div className="fulfillment-order-options">
            <fieldset className="fulfillment-preference-fieldset">
              <legend className="sr-only">Shipment fulfillment preference</legend>
              <ModusWcTypography
                hierarchy="p"
                size="xs"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label="Fulfillment preference *"
              />
              <div className="fulfillment-preference-option">
                <ModusWcRadio
                  name="fulfillment-preference"
                  label="Ship items as available (Partial shipments allowed)"
                  size="sm"
                  value={fulfillmentPreference === 'partial'}
                  onInputChange={(e: CustomEvent) => {
                    if (readInputChecked(e)) {
                      onFulfillmentPreferenceChange('partial');
                    }
                  }}
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="fulfillment-preference-description"
                  label="In-stock items ship immediately; backordered items ship when available."
                />
              </div>
              <div className="fulfillment-preference-option">
                <ModusWcRadio
                  name="fulfillment-preference"
                  label="Ship complete (Hold order until all items are in stock)"
                  size="sm"
                  value={fulfillmentPreference === 'ship_complete'}
                  onInputChange={(e: CustomEvent) => {
                    if (readInputChecked(e)) {
                      onFulfillmentPreferenceChange('ship_complete');
                    }
                  }}
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="fulfillment-preference-description"
                  label="Hold entire shipment until 100% of line items are in stock."
                />
              </div>
            </fieldset>

            <div className="fulfillment-ship-date-field">
              <ModusWcDate
                label="Requested Ship Date (Optional)"
                size="sm"
                format="yyyy-mm-dd"
                value={requestedShipDate}
                min={shipDateBounds.min}
                max={shipDateBounds.max}
                onInputChange={(e: CustomEvent) =>
                  onRequestedShipDateChange(readInputString(e))
                }
              />
              <ModusWcTypography
                hierarchy="p"
                size="xs"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label="Leave blank for immediate fulfillment (ASAP). Selecting a future date holds order release until that day (invoicing occurs upon shipment)."
              />
            </div>
          </div>
        </div>
      </ModusWcCard>

      <EditShipmentDetailsModal
        addresses={addresses}
        onAddressesChange={setAddresses}
        draftAddressId={draftAddressId}
        onDraftAddressIdChange={setDraftAddressId}
        draftCarrierId={draftCarrierId}
        onDraftCarrierIdChange={setDraftCarrierId}
        sessionStartAddressId={modalSession.addressId}
        sessionStartCarrierId={modalSession.carrierId}
        onRevertSession={revertModalSession}
        onConfirmShipTo={confirmShipTo}
        onConfirmCarrier={confirmCarrier}
        onAddressRecordUpdated={remapLinesFromAddress}
      />
    </div>
  );
}
