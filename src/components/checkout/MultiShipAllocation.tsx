import { useEffect, useMemo, useState } from 'react';
import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcCheckbox,
  ModusWcIcon,
  ModusWcSelect,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import type { ISelectOption } from '@trimble-oss/moduswebcomponents';
import type { CartLine } from '../../cart/CartContext';
import type { ShippingAddress } from '../../checkout/checkoutData';
import { groupShipmentsByAddress } from '../../checkout/shipments';
import { readInputChecked, readInputString } from '../../utils/modusFormEvents';

export interface MultiShipAllocationProps {
  lines: CartLine[];
  addressMap: Record<string, ShippingAddress>;
  shippingAddress: ShippingAddress;
  warehouses: ShippingAddress[];
  bulkOptions: ISelectOption[];
  bulkAddressId: string;
  onBulkAddressIdChange: (id: string) => void;
  onAddressMapChange: (map: Record<string, ShippingAddress>) => void;
  resolveAddress: (id: string) => ShippingAddress;
  onEditShipTo: () => void;
  assignmentError?: string | null;
}

/**
 * Multi-location allocation: pick ship-to → select unassigned items → assign,
 * then manage dynamic Shipping Assignment cards.
 */
export default function MultiShipAllocation({
  lines,
  addressMap,
  shippingAddress,
  warehouses,
  bulkOptions,
  bulkAddressId,
  onBulkAddressIdChange,
  onAddressMapChange,
  resolveAddress,
  onEditShipTo,
  assignmentError = null,
}: MultiShipAllocationProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const unassignedLines = useMemo(
    () => lines.filter((line) => !addressMap[line.product.id]),
    [lines, addressMap]
  );

  const assignedLines = useMemo(
    () => lines.filter((line) => Boolean(addressMap[line.product.id])),
    [lines, addressMap]
  );

  const assignmentGroups = useMemo(
    () =>
      assignedLines.length === 0
        ? []
        : groupShipmentsByAddress(assignedLines, addressMap, shippingAddress),
    [assignedLines, addressMap, shippingAddress]
  );

  useEffect(() => {
    const unassignedIds = new Set(unassignedLines.map((l) => l.product.id));
    setSelectedIds((prev) => prev.filter((id) => unassignedIds.has(id)));
  }, [unassignedLines]);

  const totalCount = lines.length;
  const selectedCount = selectedIds.length;
  const allAssigned = unassignedLines.length === 0 && lines.length > 0;
  const canAssign = selectedCount > 0 && Boolean(bulkAddressId);

  const lineByProductId = useMemo(() => {
    const map = new Map<string, CartLine>();
    for (const line of lines) map.set(line.product.id, line);
    return map;
  }, [lines]);

  const toggleRow = (productId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(productId) ? prev : [...prev, productId];
      }
      return prev.filter((id) => id !== productId);
    });
  };

  const assignSelected = () => {
    if (!canAssign) return;
    const address = resolveAddress(bulkAddressId);
    const next = { ...addressMap };
    for (const id of selectedIds) {
      next[id] = address;
    }
    onAddressMapChange(next);
    setSelectedIds([]);
  };

  const removeItemFromAssignment = (productId: string) => {
    const next = { ...addressMap };
    delete next[productId];
    onAddressMapChange(next);
  };

  const removeAssignment = (addressId: string) => {
    const next = { ...addressMap };
    for (const [productId, address] of Object.entries(next)) {
      if (address.id === addressId) delete next[productId];
    }
    onAddressMapChange(next);
  };

  const shipToOptions = useMemo(() => {
    if (bulkOptions.length > 0) return bulkOptions;
    return warehouses.map((w) => ({
      value: w.id,
      label: `${w.nickname} - ${w.street} ${w.city}, ${w.state}`,
    }));
  }, [bulkOptions, warehouses]);

  return (
    <div className="fulfillment-multi-alloc flex flex-col gap-4">
      <div className="fulfillment-primary-shipment">
        <div className="flex items-start justify-between gap-3">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label="Shipment details"
          />
          <ModusWcButton
            className="cart-text-link-host"
            color="primary"
            variant="borderless"
            size="sm"
            customClass="cart-text-link"
            aria-label="Edit saved shipping locations"
            onButtonClick={onEditShipTo}
          >
            Edit locations
            <ModusWcIcon name="pencil" size="xs" decorative />
          </ModusWcButton>
        </div>

        <div className="multi-ship-assign-toolbar">
          <ModusWcSelect
            label="Ship-to location"
            size="sm"
            options={shipToOptions}
            value={bulkAddressId}
            customClass="multi-ship-location-select"
            onInputChange={(e: CustomEvent) =>
              onBulkAddressIdChange(readInputString(e))
            }
          />
          <ModusWcButton
            color="tertiary"
            variant="filled"
            size="sm"
            disabled={!canAssign}
            customClass="multi-ship-assign-btn"
            aria-label="Assign selected items to ship-to location"
            onButtonClick={assignSelected}
          >
            Assign selected items
          </ModusWcButton>
        </div>

        <div
          id="multi-ship-pool"
          className={
            assignmentError
              ? 'multi-ship-pool multi-ship-pool--error'
              : 'multi-ship-pool'
          }
          aria-invalid={Boolean(assignmentError)}
          aria-describedby={
            assignmentError ? 'multi-ship-pool-error' : undefined
          }
        >
          <div className="multi-ship-pool-header">
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              weight="semibold"
              label="Select items to ship to this address"
            />
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass={
                allAssigned
                  ? 'multi-ship-pool-count multi-ship-pool-count--done'
                  : 'multi-ship-pool-count'
              }
              label={
                allAssigned
                  ? 'All items have been assigned.'
                  : `${selectedCount} of ${totalCount} items selected`
              }
            />
          </div>

          <div
            className="multi-ship-pool-error"
            id="multi-ship-pool-error"
            hidden={!assignmentError}
            aria-hidden={!assignmentError}
            role="alert"
          >
            {assignmentError ? (
              <ModusWcAlert
                variant="error"
                role="alert"
                alertTitle={assignmentError}
                alertDescription={`${unassignedLines.length} ${
                  unassignedLines.length === 1 ? 'item needs' : 'items need'
                } a ship-to location before you can place the order.`}
                customClass="multi-ship-pool-error-alert"
              />
            ) : null}
          </div>

          <div
            className="multi-ship-pool-list"
            role="list"
            aria-label="Unassigned cart items"
            hidden={allAssigned}
            aria-hidden={allAssigned}
          >
            {unassignedLines.map((line) => {
              const productId = line.product.id;
              const checked = selectedIds.includes(productId);
              return (
                <div
                  key={productId}
                  role="listitem"
                  className={
                    checked
                      ? 'multi-ship-pool-row multi-ship-pool-row--selected'
                      : 'multi-ship-pool-row'
                  }
                >
                  <ModusWcCheckbox
                    size="sm"
                    name={`multi-ship-pool-${productId}`}
                    inputId={`multi-ship-pool-${productId}`}
                    aria-label={`Select ${line.product.name}`}
                    value={checked}
                    onInputChange={(e: CustomEvent) =>
                      toggleRow(productId, readInputChecked(e))
                    }
                  />
                  <div className="multi-ship-pool-thumb" aria-hidden="true">
                    <img
                      src={line.product.image}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                  <div className="multi-ship-pool-meta min-w-0 flex-1">
                    <ModusWcTypography
                      hierarchy="p"
                      size="xs"
                      weight="bold"
                      customClass="part-number"
                      label={`PN: ${line.product.partNumber}`}
                    />
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      weight="semibold"
                      customClass="multi-ship-pool-title"
                      label={line.product.name}
                    />
                  </div>
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    customClass="multi-ship-pool-qty"
                    label={`Qty ${line.quantity}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="multi-ship-assignments flex flex-col gap-3"
        hidden={assignmentGroups.length === 0}
        aria-hidden={assignmentGroups.length === 0}
      >
        {assignmentGroups.map((group) => (
          <section
            key={group.address.id}
            className="multi-ship-assignment-card"
            aria-label={`Shipping assignment ${group.address.nickname}`}
          >
            <div className="multi-ship-assignment-header">
              <ModusWcTypography
                hierarchy="h3"
                size="sm"
                weight="semibold"
                label={`Shipping Assignment: ${group.address.nickname}`}
              />
              <ModusWcButton
                color="tertiary"
                variant="borderless"
                shape="square"
                size="sm"
                aria-label={`Remove assignment for ${group.address.nickname}`}
                onButtonClick={() => removeAssignment(group.address.id)}
              >
                <ModusWcIcon name="delete" size="sm" decorative />
              </ModusWcButton>
            </div>

            <ul className="multi-ship-assignment-items">
              {group.items.map((item) => {
                const line = lineByProductId.get(item.productId);
                if (!line) return null;

                return (
                  <li
                    key={`${group.address.id}-${item.productId}`}
                    className="multi-ship-assignment-row"
                  >
                    <div
                      className="multi-ship-pool-thumb"
                      aria-hidden="true"
                    >
                      <img
                        src={line.product.image}
                        alt=""
                        loading="lazy"
                      />
                    </div>
                    <div className="multi-ship-pool-meta min-w-0 flex-1">
                      <ModusWcTypography
                        hierarchy="p"
                        size="xs"
                        weight="bold"
                        customClass="part-number"
                        label={`PN: ${line.product.partNumber}`}
                      />
                      <ModusWcTypography
                        hierarchy="p"
                        size="sm"
                        weight="semibold"
                        customClass="multi-ship-pool-title"
                        label={line.product.name}
                      />
                    </div>
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      customClass="multi-ship-pool-qty"
                      label={`Qty ${line.quantity}`}
                    />
                    <ModusWcButton
                      color="danger"
                      variant="borderless"
                      shape="square"
                      size="sm"
                      aria-label={`Remove ${line.product.name} from ${group.address.nickname}`}
                      onButtonClick={() =>
                        removeItemFromAssignment(item.productId)
                      }
                    >
                      <ModusWcIcon name="close" size="xs" decorative />
                    </ModusWcButton>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
