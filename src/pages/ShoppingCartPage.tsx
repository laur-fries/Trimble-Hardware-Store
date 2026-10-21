import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { useCart } from '../cart/CartContext';
import CartShell from '../components/cart/CartShell';
import ClearCartModal, {
  openClearCartModal,
} from '../components/cart/ClearCartModal';
import {
  SaveListModal,
  openSaveListModal,
} from '../components/cart/CartModals';
import FrequentlyPurchasedSection from '../components/cart/FrequentlyPurchasedSection';
import OrderSummaryPanel from '../components/cart/OrderSummaryPanel';
import DARequestModal, {
  openDARequestModal,
} from '../components/da/DARequestModal';
import { useDaRequests } from '../da/DaContext';

/**
 * Full-page shopping cart: Cart shell + sticky order summary.
 * Empty cart shows an Amazon-style “Buy again” rail under the empty state.
 */
export default function ShoppingCartPage() {
  const navigate = useNavigate();
  const {
    items,
    addItem,
    increment,
    decrement,
    setQuantity,
    removeItem,
    replaceDiscontinuedItem,
    clearCart,
    closeCart,
  } = useCart();
  const { submitRequest } = useDaRequests();

  const [toast, setToast] = useState<string | null>(null);
  /** Set on DA submit; cleared when leaving `/cart` (component unmount). */
  const [submittedDaId, setSubmittedDaId] = useState<string | null>(null);

  const itemCount = useMemo(
    () => items.reduce((total, line) => total + line.quantity, 0),
    [items]
  );

  const hasDiscontinued = useMemo(
    () => items.some((line) => line.product.isDiscontinued),
    [items]
  );

  const isEmpty = items.length === 0;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4200);
  };

  const goToPendingOrders = () => {
    navigate('/account/orders?tab=pending');
  };

  return (
    <>
      <div className="page-container py-8">
        <div className="mb-3">
          <ModusWcButton
            className="cart-text-link-host"
            color="primary"
            variant="borderless"
            size="sm"
            customClass="cart-text-link"
            aria-label="Back to catalog"
            onButtonClick={() => {
              closeCart();
              navigate('/catalog');
            }}
          >
            <ModusWcIcon name="arrow_left" size="xs" decorative />
            Back to catalog
          </ModusWcButton>
        </div>

        <div className="mb-6">
          <ModusWcTypography
            hierarchy="h1"
            size="3xl"
            weight="normal"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label="Your Cart"
          />
        </div>

        {submittedDaId ? (
          <div className="da-success-banner mb-6">
            <ModusWcAlert
              variant="success"
              role="status"
              customClass="da-success-alert"
              alertTitle={`Your discount request (#${submittedDaId}) has been submitted`}
              alertDescription="Your request has been submitted. Reviews are typically completed within 48 hours."
            />
            {/* Sibling (not slot="button"): navigating from a slotted Modus CTA
                can whitescreen on unmount. CSS places this inside the alert. */}
            <ModusWcButton
              className="cart-text-link-host da-success-banner-action-host"
              color="primary"
              variant="borderless"
              size="sm"
              customClass="cart-text-link da-success-banner-action"
              aria-label="View request status in Pending orders"
              onButtonClick={goToPendingOrders}
            >
              View request status
              <ModusWcIcon name="arrow_right" size="xs" decorative />
            </ModusWcButton>
          </div>
        ) : null}

        {toast ? (
          <div className="mb-4" role="status" aria-live="polite">
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              weight="semibold"
              label={toast}
            />
          </div>
        ) : null}

        {isEmpty ? (
          <div className="flex flex-col gap-10">
            <ModusWcCard bordered={true} padding="comfortable">
              <div className="flex flex-col items-center gap-3 py-10 text-center sm:py-14">
                <ModusWcIcon
                  name="shopping_cart"
                  size="lg"
                  aria-label="Empty cart"
                  customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                />
                <ModusWcTypography
                  hierarchy="h2"
                  size="lg"
                  weight="semibold"
                  label="Your cart is empty"
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  customClass="max-w-md text-[var(--modus-wc-color-base-content-low-contrast)]"
                  label="Browse the catalog to add hardware to your order."
                />
                <ModusWcButton
                  color="primary"
                  variant="filled"
                  size="sm"
                  aria-label="Browse catalog"
                  onButtonClick={() => navigate('/catalog')}
                >
                  <ModusWcIcon name="apps" size="xs" decorative />
                  Browse catalog
                </ModusWcButton>
              </div>
            </ModusWcCard>

            <FrequentlyPurchasedSection
              onAddToCart={(product) => {
                addItem(product);
                showToast(`Added ${product.name} to cart`);
              }}
            />
          </div>
        ) : (
          <div className="page-grid">
            <div className="page-col-12 page-col-lg-8">
              <CartShell
                items={items}
                onClearCart={openClearCartModal}
                onIncrement={increment}
                onDecrement={(id) => {
                  const line = items.find((l) => l.product.id === id);
                  if (line && line.quantity <= 1) {
                    removeItem(id);
                  } else {
                    decrement(id);
                  }
                }}
                onSetQuantity={setQuantity}
                onRemove={removeItem}
                onReplaceDiscontinued={(id, replacement) => {
                  replaceDiscontinuedItem(id, replacement);
                  showToast(`Replaced with ${replacement.name}`);
                }}
              />
            </div>

            <div className="page-col-12 page-col-lg-4">
              <OrderSummaryPanel
                lines={items}
                itemCount={itemCount}
                checkoutBlocked={hasDiscontinued}
                onCheckout={() => {
                  if (itemCount === 0) {
                    showToast('Add items to your cart before checkout');
                    return;
                  }
                  if (hasDiscontinued) {
                    showToast(
                      'Replace or remove discontinued items before checkout'
                    );
                    return;
                  }
                  navigate('/checkout');
                }}
                onRequestDa={() => {
                  if (itemCount === 0) {
                    showToast('Add items to your cart before requesting a DA');
                    return;
                  }
                  openDARequestModal();
                }}
                onSaveAsList={openSaveListModal}
                onDownloadQuote={() =>
                  showToast(
                    itemCount === 0
                      ? 'Add items to your cart before downloading a quote'
                      : 'Quote PDF download is a prototype — file would generate from ERP'
                  )
                }
              />
            </div>
          </div>
        )}
      </div>

      <ClearCartModal
        onConfirm={() => {
          clearCart();
          showToast('Cart cleared');
        }}
      />
      <DARequestModal
        onSubmit={(payload) => {
          if (items.length === 0) {
            showToast('Add items to your cart before requesting a DA');
            return;
          }
          const request = submitRequest(items, payload);
          clearCart();
          setSubmittedDaId(request.id);
        }}
      />
      <SaveListModal
        onSave={(name) => showToast(`Saved cart as list “${name}”`)}
      />
    </>
  );
}
