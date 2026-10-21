import { useMemo, useState } from 'react';
import { ModusWcTypography } from '@trimble-oss/moduswebcomponents-react';
import DirectOrderModal from '../components/DirectOrderModal';
import Hero from '../components/Hero';
import IndustrySection from '../components/IndustrySection';
import ProductSection from '../components/ProductSection';
import { useCart } from '../cart/CartContext';
import { catalogProducts, type CatalogProduct } from '../catalogData';
import {
  FREQUENTLY_PURCHASED_IDS,
  NEW_HARDWARE_IDS,
} from '../data';

function resolveByIds(ids: readonly string[]): CatalogProduct[] {
  const byId = new Map(catalogProducts.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is CatalogProduct => Boolean(p));
}

export default function HomePage() {
  const { addItem } = useCart();
  const [toast, setToast] = useState<string | null>(null);

  const frequentlyPurchased = useMemo(
    () => resolveByIds(FREQUENTLY_PURCHASED_IDS),
    []
  );
  const newHardware = useMemo(() => resolveByIds(NEW_HARDWARE_IDS), []);

  const handleAddToCart = (product: CatalogProduct) => {
    addItem(product);
    setToast(`Added ${product.name} to cart`);
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <>
      <Hero />

      <div className="page-container flex flex-col gap-16 py-16">
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

        <IndustrySection />

        <ProductSection
          id="frequently-purchased"
          eyebrow="Frequently purchased"
          title="Essential hardware frequently ordered across your organization"
          products={frequentlyPurchased}
          onAddToCart={handleAddToCart}
        />

        <ProductSection
          id="new-hardware"
          eyebrow="New hardware"
          title="Latest field systems kits and controllers ready for dealer stock"
          products={newHardware}
          onAddToCart={handleAddToCart}
          showBrowseCatalogLink
        />
      </div>

      <DirectOrderModal
        onAddLines={(lines) => {
          let added = 0;
          for (const raw of lines) {
            const [pn] = raw.split(',').map((s) => s.trim());
            if (!pn) continue;
            const match = catalogProducts.find(
              (p) => p.partNumber.toLowerCase() === pn.toLowerCase()
            );
            if (!match) continue;
            addItem(match);
            added += 1;
          }
          setToast(
            added > 0
              ? `Added ${added} ${added === 1 ? 'item' : 'items'} from guided selling`
              : 'No matching catalog part numbers found'
          );
          window.setTimeout(() => setToast(null), 3200);
        }}
      />
    </>
  );
}
