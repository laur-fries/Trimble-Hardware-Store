import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { BILLING_ACCOUNT, DEMO_SALES_ORDER_NUMBER } from '../checkout/checkoutData';
import { buildDemoConfirmation } from '../checkout/demoConfirmation';
import TransactionIssueModal, {
  openTransactionIssueModal,
} from '../components/orders/TransactionIssueModal';
import { useCart } from '../cart/CartContext';
import { CURRENT_USER_TID } from '../da/types';
import FrequentlyPurchasedSection from '../components/cart/FrequentlyPurchasedSection';
import OrderConfirmationBanner from '../components/orderConfirmation/OrderConfirmationBanner';
import OrderConfirmationSummarySidebar from '../components/orderConfirmation/OrderConfirmationSummarySidebar';
import ShipmentGroup from '../components/orderConfirmation/ShipmentGroup';
import type { OrderConfirmationState } from './CheckoutPage';

/**
 * Post-checkout confirmation: hold-aware banner, per-shipment fulfillment
 * manifests sized for large B2B orders, and a sticky order summary sidebar.
 */
export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as OrderConfirmationState | null;
  const [toast, setToast] = useState<string | null>(null);
  const { addItem } = useCart();

  const salesOrderNumber =
    state?.salesOrderNumber ?? DEMO_SALES_ORDER_NUMBER;

  const hasSpecialInstructions = Boolean(
    state?.hasSpecialInstructions ??
      state?.orderHoldStatus === 'MANUAL_SHIPPING_HOLD'
  );

  const demo = useMemo(() => buildDemoConfirmation(), []);
  const hasCheckoutShipments = Boolean(state?.confirmationShipments?.length);
  const shipments = hasCheckoutShipments
    ? state!.confirmationShipments!
    : demo.shipments;
  const pricing =
    state?.pricing ?? (hasCheckoutShipments ? undefined : demo.pricing);

  const placedByTid =
    state?.placedByTid ?? 'dealer.ops@trimblehardware.demo';
  const placedTimestamp = state?.placedTimestamp ?? new Date().toISOString();
  const paymentTerms =
    state?.paymentTerms ?? BILLING_ACCOUNT.paymentTerms;
  const dealerPoNumber =
    state?.dealerPoNumber ?? state?.dealerPo ?? '';
  const netTotal = state?.netTotal ?? demo.netTotal;
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="page-grid">
        <div className="page-col-12 mb-4">
          <ModusWcButton
            className="cart-text-link-host self-start"
            color="primary"
            variant="borderless"
            size="sm"
            customClass="cart-text-link"
            aria-label="Return to Hardware Catalog"
            onButtonClick={() => navigate('/catalog')}
          >
            <ModusWcIcon name="arrow_left" size="xs" decorative />
            Return to Hardware Catalog
          </ModusWcButton>
        </div>

        <div className="page-col-12 page-col-lg-8 flex flex-col gap-6">
          <ModusWcTypography
            hierarchy="h1"
            size="3xl"
            weight="semibold"
            label="Order confirmation"
          />

          {toast ? (
            <div role="status" aria-live="polite">
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                weight="semibold"
                label={toast}
              />
            </div>
          ) : null}

          <OrderConfirmationBanner
            hasSpecialInstructions={hasSpecialInstructions}
            salesOrderNumber={salesOrderNumber}
            confirmationEmail={CURRENT_USER_TID.email}
          />

          <section
            className="flex flex-col gap-4"
            aria-labelledby="fulfillment-manifest-heading"
          >
            <ModusWcTypography
              id="fulfillment-manifest-heading"
              hierarchy="h2"
              size="xl"
              weight="semibold"
              label={`Fulfillment manifest (${shipments.length} ${
                shipments.length === 1 ? 'shipment' : 'shipments'
              })`}
            />
            {shipments.map((shipment, index) => (
              <ShipmentGroup
                key={shipment.addressId}
                shipment={shipment}
                index={index}
                totalShipments={shipments.length}
                salesOrderNumber={salesOrderNumber}
              />
            ))}
          </section>
        </div>

        <div className="page-col-12 page-col-lg-4 order-confirmation-sidebar-col">
          <OrderConfirmationSummarySidebar
            pricing={pricing}
            salesOrderNumber={salesOrderNumber}
            dealerPoNumber={dealerPoNumber}
            placedByTid={placedByTid}
            placedTimestamp={placedTimestamp}
            paymentTerms={paymentTerms}
            netTotal={netTotal}
            onTrackInOrders={() => navigate('/account/orders')}
            onDownloadProforma={() =>
              showToast(
                `Proforma invoice downloaded for ${salesOrderNumber}.`
              )
            }
            onContactSupport={() => openTransactionIssueModal()}
          />
        </div>

        <div className="page-col-12 mt-8">
          <FrequentlyPurchasedSection
            onAddToCart={(product) => {
              addItem(product);
              showToast(`Added ${product.name} to cart`);
            }}
          />
        </div>
      </div>

      <TransactionIssueModal
        salesOrderNumber={salesOrderNumber}
        dealerPoNumber={dealerPoNumber}
        onSubmit={() =>
          showToast(`Support request logged for ${salesOrderNumber}.`)
        }
      />
    </div>
  );
}
