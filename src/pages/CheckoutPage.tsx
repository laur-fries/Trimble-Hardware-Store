import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { buildOrderBreakdown } from '../cart/orderPricing';
import {
  BILLING_ACCOUNT,
  DEFAULT_SHIPPING_OPTION_ID,
  DEMO_SALES_ORDER_NUMBER,
  SHIPPING_ADDRESSES,
  SHIPPING_OPTIONS,
  type ShippingAddress,
} from '../checkout/checkoutData';
import {
  buildConfirmationShipments,
  type ConfirmationPricing,
  type ConfirmationShipment,
} from '../checkout/confirmation';
import {
  buildDefaultAddressMap,
  buildShippingPayload,
  type ShippingPayload,
} from '../checkout/shipments';
import {
  DEFAULT_FULFILLMENT_PREFERENCE,
  type FulfillmentPreference,
} from '../checkout/fulfillmentPreferences';
import type { OrderHoldStatus } from '../checkout/specialShippingInstructions';
import CheckoutHeader from '../components/checkout/CheckoutHeader';
import CheckoutTabletActionBar from '../components/checkout/CheckoutTabletActionBar';
import FulfillmentSection from '../components/checkout/FulfillmentSection';
import OrderItemsSummary from '../components/checkout/OrderItemsSummary';
import OrderSummarySidebar from '../components/checkout/OrderSummarySidebar';
import PaymentInfoCard from '../components/checkout/PaymentInfoCard';
import SpecialShippingInstructionsCard from '../components/checkout/SpecialShippingInstructionsCard';
import { useDaRequests } from '../da/DaContext';
import { useSpecialShippingInstructions } from '../hooks/useSpecialShippingInstructions';

export interface OrderConfirmationState {
  salesOrderNumber: string;
  dealerPo: string;
  dealerPoNumber: string;
  fulfillmentPreference: FulfillmentPreference;
  requestedShipDate?: string;
  itemCount: number;
  netTotal: number;
  hasSpecialInstructions?: boolean;
  orderHoldStatus?: OrderHoldStatus;
  specialShippingNotes?: string;
  isMultiShip?: boolean;
  /** Structured single / multi-destination shipping handoff payload. */
  shipping?: ShippingPayload;
  /** Display-ready shipments for the confirmation page layout. */
  confirmationShipments?: ConfirmationShipment[];
  pricing?: ConfirmationPricing;
  placedByTid?: string;
  placedTimestamp?: string;
  paymentTerms?: string;
  shippingCarrierLabel?: string;
}

interface CheckoutLocationState {
  selectedIds?: string[];
  lockedDaId?: string;
}

/**
 * B2B checkout: compact item summary, unified fulfillment, special-shipping hold.
 */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart, closeCart } = useCart();
  const { getRequest, markOrdered } = useDaRequests();

  const locationState = location.state as CheckoutLocationState | null;
  const lockedDaId = locationState?.lockedDaId;
  const lockedRequest = lockedDaId ? getRequest(lockedDaId) : undefined;
  const isLockedDaCheckout = Boolean(
    lockedRequest && lockedRequest.status === 'APPROVED'
  );

  const selectedIds = locationState?.selectedIds;

  const checkoutLines = useMemo(() => {
    if (isLockedDaCheckout && lockedRequest) {
      return lockedRequest.lines;
    }
    if (!selectedIds?.length) return items;
    const selected = items.filter((line) =>
      selectedIds.includes(line.product.id)
    );
    return selected.length > 0 ? selected : items;
  }, [items, selectedIds, isLockedDaCheckout, lockedRequest]);

  useEffect(() => {
    if (isLockedDaCheckout) return;
    if (checkoutLines.some((line) => line.product.isDiscontinued)) {
      navigate('/cart', { replace: true });
    }
  }, [checkoutLines, isLockedDaCheckout, navigate]);

  const [isMultiShip, setIsMultiShip] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(
    SHIPPING_ADDRESSES[0]
  );
  const [addressMap, setAddressMap] = useState<Record<string, ShippingAddress>>(
    () => buildDefaultAddressMap(checkoutLines, SHIPPING_ADDRESSES[0])
  );
  const [shippingOptionId, setShippingOptionId] = useState(
    DEFAULT_SHIPPING_OPTION_ID
  );
  const {
    state: specialShipping,
    setState: setSpecialShipping,
  } = useSpecialShippingInstructions();
  const [billingContact, setBillingContact] = useState('');
  const [billingError, setBillingError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [multiShipAssignmentError, setMultiShipAssignmentError] = useState<
    string | null
  >(null);
  const [specialShippingNotesError, setSpecialShippingNotesError] =
    useState(false);
  const [dealerPoNumber, setDealerPoNumber] = useState('');
  const [dealerPoError, setDealerPoError] = useState<string | null>(null);
  const [fulfillmentPreference, setFulfillmentPreference] =
    useState<FulfillmentPreference>(DEFAULT_FULFILLMENT_PREFERENCE);
  const [requestedShipDate, setRequestedShipDate] = useState('');

  useEffect(() => {
    closeCart();
  }, [closeCart]);

  useEffect(() => {
    if (isLockedDaCheckout) return;
    if (items.length === 0 && !placing) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate, placing, isLockedDaCheckout]);

  useEffect(() => {
    if (lockedDaId && !lockedRequest) {
      navigate('/account/orders?tab=pending', { replace: true });
      return;
    }
    if (
      lockedRequest &&
      lockedRequest.status !== 'APPROVED' &&
      lockedRequest.status !== 'ORDERED'
    ) {
      navigate('/account/orders?tab=pending', { replace: true });
    }
  }, [lockedDaId, lockedRequest, navigate]);

  useEffect(() => {
    setAddressMap((prev) => {
      const next: Record<string, ShippingAddress> = {};
      for (const line of checkoutLines) {
        const existing = prev[line.product.id];
        if (existing) {
          next[line.product.id] = existing;
        } else if (!isMultiShip) {
          next[line.product.id] = shippingAddress;
        }
        // Multi-ship: leave unassigned until the shopper assigns a location.
      }
      return next;
    });
  }, [checkoutLines, shippingAddress, isMultiShip]);

  const shippingPayload = useMemo(
    () =>
      buildShippingPayload(
        isMultiShip,
        checkoutLines,
        addressMap,
        shippingAddress,
        {
          carrierId: shippingOptionId,
          fulfillmentPreference,
          requestedShipDate: requestedShipDate || undefined,
        }
      ),
    [
      isMultiShip,
      checkoutLines,
      addressMap,
      shippingAddress,
      shippingOptionId,
      fulfillmentPreference,
      requestedShipDate,
    ]
  );

  const lineCount = useMemo(
    () => checkoutLines.reduce((sum, line) => sum + line.quantity, 0),
    [checkoutLines]
  );

  const breakdown = useMemo(
    () => buildOrderBreakdown(checkoutLines),
    [checkoutLines]
  );

  const netTotal =
    isLockedDaCheckout && lockedRequest?.approvedNetTotal != null
      ? lockedRequest.approvedNetTotal
      : breakdown.netTotal;

  const unassignedMultiShipCount = useMemo(() => {
    if (!isMultiShip) return 0;
    return checkoutLines.filter((line) => !addressMap[line.product.id]).length;
  }, [isMultiShip, checkoutLines, addressMap]);

  useEffect(() => {
    if (unassignedMultiShipCount === 0 && multiShipAssignmentError) {
      setMultiShipAssignmentError(null);
    }
  }, [unassignedMultiShipCount, multiShipAssignmentError]);

  const placeOrder = () => {
    if (!dealerPoNumber.trim()) {
      setDealerPoError('Enter a dealer PO number.');
      window.requestAnimationFrame(() => {
        document.getElementById('dealerPo')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        document.getElementById('dealerPo')?.focus();
      });
      return;
    }
    if (isLockedDaCheckout && !billingContact.trim()) {
      setBillingError('Billing contact is required for approved DA checkout.');
      return;
    }
    if (
      specialShipping.isSpecialShippingSelected &&
      !specialShipping.instructionsText.trim()
    ) {
      setSpecialShippingNotesError(true);
      window.requestAnimationFrame(() => {
        const notesField = document.getElementById('special-shipping-notes');
        notesField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        notesField?.focus();
      });
      return;
    }
    if (isMultiShip && unassignedMultiShipCount > 0) {
      const message =
        unassignedMultiShipCount === 1
          ? 'Assign the remaining item to a ship-to location before placing your order.'
          : `Assign all ${unassignedMultiShipCount} remaining items to a ship-to location before placing your order.`;
      setMultiShipAssignmentError(message);
      window.requestAnimationFrame(() => {
        document
          .getElementById('multi-ship-pool')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    setBillingError(null);
    setDealerPoError(null);
    setMultiShipAssignmentError(null);
    setSpecialShippingNotesError(false);
    setPlacing(true);

    const salesOrderNumber = isLockedDaCheckout
      ? `SO-${String(Date.now()).slice(-6)}`
      : DEMO_SALES_ORDER_NUMBER;

    const placedTimestamp = new Date().toISOString();
    const shippingCarrierLabel =
      SHIPPING_OPTIONS.find((o) => o.id === shippingOptionId)?.shortLabel ??
      SHIPPING_OPTIONS[0].shortLabel;
    const hasSpecialInstructions = specialShipping.hasSpecialInstructions;

    const confirmationShipments = buildConfirmationShipments(
      isMultiShip,
      checkoutLines,
      addressMap,
      shippingAddress,
      {
        hasSpecialInstructions,
        placedAt: placedTimestamp,
        carrierLabel: shippingCarrierLabel,
      }
    );

    window.setTimeout(() => {
      if (isLockedDaCheckout && lockedRequest) {
        markOrdered(lockedRequest.id, salesOrderNumber);
      } else {
        clearCart();
      }
      const state: OrderConfirmationState = {
        salesOrderNumber,
        dealerPo: dealerPoNumber.trim(),
        dealerPoNumber: dealerPoNumber.trim(),
        fulfillmentPreference,
        requestedShipDate: requestedShipDate || undefined,
        itemCount: lineCount,
        netTotal,
        hasSpecialInstructions: specialShipping.hasSpecialInstructions,
        orderHoldStatus: specialShipping.orderHoldStatus,
        specialShippingNotes: specialShipping.hasSpecialInstructions
          ? specialShipping.instructionsText.trim()
          : undefined,
        isMultiShip: shippingPayload.isMultiShip,
        shipping: shippingPayload,
        confirmationShipments,
        pricing: {
          subtotalMsrp: breakdown.msrpSubtotal,
          dealerDiscount: breakdown.standardDiscount,
          kpiDiscount: breakdown.kpiDiscount,
          promoSavings: breakdown.promoSavings,
          estimatedTax: breakdown.estimatedTax,
        },
        placedByTid:
          billingContact.trim() || 'dealer.ops@trimblehardware.demo',
        placedTimestamp,
        paymentTerms: BILLING_ACCOUNT.paymentTerms,
        shippingCarrierLabel,
      };
      navigate('/order-confirmation', { state, replace: true });
    }, 900);
  };

  if (checkoutLines.length === 0) {
    return null;
  }

  return (
    <div className="page-container checkout-page py-6 sm:py-8">
      <div className="page-grid">
        <div className="page-col-12 flex flex-col gap-6">
          <CheckoutHeader
            frozen={isLockedDaCheckout}
            backTo={
              isLockedDaCheckout ? '/account/orders?tab=pending' : '/cart'
            }
            backLabel={
              isLockedDaCheckout
                ? 'Back to Your Orders'
                : 'Back to cart'
            }
          />
        </div>

        <div className="page-col-12 page-col-lg-8 flex flex-col gap-[20px]">
          <FulfillmentSection
            lines={checkoutLines}
            shippingAddress={shippingAddress}
            addressMap={addressMap}
            shippingOptionId={shippingOptionId}
            isMultiShip={isMultiShip}
            onMultiShipChange={(next) => {
              setIsMultiShip(next);
              setMultiShipAssignmentError(null);
            }}
            onShippingAddressChange={setShippingAddress}
            onAddressMapChange={(map) => {
              setAddressMap(map);
              setMultiShipAssignmentError(null);
            }}
            onLineShipToChange={(productId, address) => {
              setAddressMap((prev) => ({
                ...prev,
                [productId]: address,
              }));
              setMultiShipAssignmentError(null);
            }}
            onShippingOptionChange={setShippingOptionId}
            fulfillmentPreference={fulfillmentPreference}
            onFulfillmentPreferenceChange={setFulfillmentPreference}
            requestedShipDate={requestedShipDate}
            onRequestedShipDateChange={setRequestedShipDate}
            multiShipAssignmentError={multiShipAssignmentError}
          />

          <SpecialShippingInstructionsCard
            showNotesValidationError={specialShippingNotesError}
            onStateChange={(state) => {
              setSpecialShipping(state);
              if (state.instructionsText.trim() || !state.isSpecialShippingSelected) {
                setSpecialShippingNotesError(false);
              }
            }}
          />

          <PaymentInfoCard
            dealerPoNumber={dealerPoNumber}
            dealerPoError={dealerPoError}
            onDealerPoNumberChange={(value) => {
              setDealerPoNumber(value);
              if (dealerPoError) setDealerPoError(null);
            }}
            billingContact={billingContact}
            billingError={billingError}
            requireBillingContact={isLockedDaCheckout}
            onBillingContactChange={(value) => {
              setBillingContact(value);
              if (billingError) setBillingError(null);
            }}
          />

          <OrderItemsSummary
            lines={checkoutLines}
            frozen={isLockedDaCheckout}
            approvedDaId={
              isLockedDaCheckout ? lockedRequest?.id : undefined
            }
          />
        </div>

        <div className="page-col-12 page-col-lg-4 checkout-summary-column">
          <OrderSummarySidebar
            lines={checkoutLines}
            placing={placing}
            orderHoldStatus={specialShipping.orderHoldStatus}
            approvedDa={
              isLockedDaCheckout && lockedRequest
                ? {
                    id: lockedRequest.id,
                    approvedNetTotal: netTotal,
                  }
                : undefined
            }
            onPlaceOrder={placeOrder}
          />
        </div>
      </div>

      <CheckoutTabletActionBar
        total={netTotal}
        placing={placing}
        orderHoldStatus={specialShipping.orderHoldStatus}
        onPlaceOrder={placeOrder}
      />
    </div>
  );
}
