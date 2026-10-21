import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ITab } from '@trimble-oss/moduswebcomponents';
import {
  ModusWcAlert,
  ModusWcBadge,
  ModusWcButton,
  ModusWcCheckbox,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcNumberInput,
  ModusWcTabs,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { formatUsd, useCart } from '../cart/CartContext';
import {
  createDefaultBomSelection,
  isBomComponentSelectable,
  resolveBomComponents,
} from '../cart/bomHelpers';
import {
  findLegacyProductsReplacedBy,
  isDiscontinuedProduct,
  resolveReplacementProduct,
} from '../catalog/discontinuation';
import {
  catalogProducts,
  formatCatalogPrice,
  parsePrice,
  resolveListPrice,
  type CatalogProduct,
  type StockStatus,
} from '../catalogData';
import {
  productDetailPath,
  resolveDisplayProduct,
} from '../catalog/productLookup';
import {
  BOM_SECTION_DOM_ID,
  getUniversalProductBom,
} from '../catalog/productBom';
import DiscontinuedBadge from '../components/DiscontinuedBadge';
import DiscontinuedBanner from '../components/product/DiscontinuedBanner';
import ProductDetailBomSection from '../components/product/ProductDetailBomSection';
import ReplacementNoticeBanner from '../components/product/ReplacementNoticeBanner';
import ProductOverviewTabContent from '../components/product/ProductOverviewTabContent';
import ProductImage from '../components/ProductImage';
import { readInputChecked, readInputString } from '../utils/modusFormEvents';

const DEALER_DISCOUNT_RATE = 0.07;
const KPI_DISCOUNT_RATE = 0.1;

const stockMeta: Record<
  Exclude<StockStatus, 'out-of-stock'>,
  { color: 'success' | 'warning'; icon: string; label: string }
> = {
  'in-stock': {
    color: 'success',
    icon: 'check_circle',
    label: 'Plenty in stock',
  },
  limited: {
    color: 'warning',
    icon: 'warning',
    label: 'Limited availability',
  },
};

function splitUsdForDisplay(amount: number): {
  dollars: string;
  cents: string;
} {
  const [whole, fraction = '00'] = amount.toFixed(2).split('.');
  const dollars = Number(whole).toLocaleString('en-US');
  return { dollars: `$${dollars}`, cents: fraction };
}

function pdpStockLabel(stock: StockStatus): {
  color: 'success' | 'warning';
  icon: string;
  label: string;
} | null {
  if (stock === 'out-of-stock') return null;
  const meta = stockMeta[stock];
  return {
    ...meta,
    label: stock === 'in-stock' ? 'In stock' : meta.label,
  };
}

function relatedProductsFor(product: CatalogProduct): CatalogProduct[] {
  const industry = product.facets.industry?.[0];
  const sameIndustry = catalogProducts.filter(
    (p) =>
      p.id !== product.id &&
      (!industry || (p.facets.industry ?? []).includes(industry))
  );
  const pool = sameIndustry.length >= 3 ? sameIndustry : catalogProducts;
  return pool.filter((p) => p.id !== product.id).slice(0, 6);
}

function galleryImagesFor(product: CatalogProduct): string[] {
  const fromBom = (product.bom ?? [])
    .map((item) => item.image)
    .filter((src): src is string => Boolean(src));
  const unique = Array.from(new Set([product.image, ...fromBom]));
  while (unique.length < 5 && unique.length > 0) {
    unique.push(unique[unique.length % Math.max(1, fromBom.length || 1)]!);
  }
  return unique.slice(0, 5);
}

/**
 * Product detail page — gallery, discounts, qty, BOM tabs, related rail, sticky bar.
 */
export default function ProductDetailPage() {
  const { productKey = '' } = useParams<{ productKey: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { addQuantity, addItem } = useCart();

  const product = useMemo(
    () => resolveDisplayProduct(productKey),
    [productKey]
  );

  const universalBom = useMemo(
    () => (product ? getUniversalProductBom(product) : []),
    [product]
  );

  const components = useMemo(
    () => (product ? resolveBomComponents(product) : []),
    [product]
  );

  const hasKitConfigurator = Boolean(
    product?.isKit && components.length > 0
  );
  const showBomTab = universalBom.length > 0;

  const gallery = useMemo(
    () => (product ? galleryImagesFor(product) : []),
    [product]
  );

  const related = useMemo(
    () => (product ? relatedProductsFor(product) : []),
    [product]
  );

  const replacementProduct = useMemo(
    () => (product ? resolveReplacementProduct(product) : undefined),
    [product]
  );
  const tabs: ITab[] = useMemo(
    () =>
      showBomTab
        ? [
            { label: 'Bill of Materials (BOM)' },
            { label: 'Overview' },
            { label: 'Specifications' },
          ]
        : [{ label: 'Overview' }, { label: 'Specifications' }],
    [showBomTab]
  );

  const [activeTab, setActiveTab] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [dealerDiscount, setDealerDiscount] = useState(true);
  const [kpiDiscount, setKpiDiscount] = useState(true);
  const [bomOpen, setBomOpen] = useState(false);

  const wantsBomDeepLink = useMemo(() => {
    const hashMatch =
      location.hash === `#${BOM_SECTION_DOM_ID}` ||
      location.hash === '#bom';
    const expandParam = searchParams.get('expandBom') === 'true';
    const stateExpand = Boolean(
      (location.state as { expandBom?: boolean } | null)?.expandBom
    );
    return hashMatch || expandParam || stateExpand;
  }, [location.hash, location.state, searchParams]);

  // Reset local PDP state when the route product changes.
  useEffect(() => {
    if (!product) return;
    setActiveImage(0);
    setQuantity(1);
    setDealerDiscount(true);
    setKpiDiscount(true);
    setBomOpen(wantsBomDeepLink);
    setActiveTab(wantsBomDeepLink && showBomTab ? 0 : 0);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- reset on product change only

  useEffect(() => {
    if (!product || !showBomTab) return;
    if (!wantsBomDeepLink) return;
    setActiveTab(0);
    setBomOpen(true);
    const scroll = () => {
      document.getElementById(BOM_SECTION_DOM_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scroll);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [wantsBomDeepLink, product, showBomTab]);

  if (!product) {
    return (
      <div className="page-container py-8">
        <ModusWcButton
          className="cart-text-link-host mb-4 w-fit"
          color="primary"
          variant="borderless"
          size="sm"
          customClass="cart-text-link"
          aria-label="Back to catalog"
          onButtonClick={() => navigate('/catalog')}
        >
          <ModusWcIcon name="arrow_left" size="xs" decorative />
          Back to catalog
        </ModusWcButton>
        <ModusWcTypography
          hierarchy="h1"
          size="2xl"
          weight="semibold"
          label="Product not found"
        />
      </div>
    );
  }

  const isBomOnly = product.id.startsWith('bom-');
  const isKit = Boolean(product.isKit);
  const bundleSavings =
    isKit && product.bundleSavings && product.bundleSavings > 0
      ? product.bundleSavings
      : undefined;
  const discontinued = isDiscontinuedProduct(product);
  const replacement = replacementProduct;
  const legacyReplaced = findLegacyProductsReplacedBy(product);
  const listAmount = parsePrice(resolveListPrice(product));
  const dealerOff = listAmount * DEALER_DISCOUNT_RATE;
  const kpiOff = listAmount * KPI_DISCOUNT_RATE;
  const bomUnit = hasKitConfigurator
    ? components.reduce((sum, c) => {
        if (!isBomComponentSelectable(c.stock)) return sum;
        return sum + c.unitPrice * Math.max(1, c.defaultQty);
      }, 0)
    : 0;
  const catalogUnit =
    hasKitConfigurator && bomUnit > 0
      ? bomUnit
      : parsePrice(product.price);
  let unitAmount = catalogUnit;
  if (dealerDiscount || kpiDiscount) {
    unitAmount = listAmount;
    if (dealerDiscount) unitAmount -= dealerOff;
    if (kpiDiscount) unitAmount -= kpiOff;
  }
  unitAmount = Math.max(0, Math.round(unitAmount * 100) / 100);
  const lineTotal = unitAmount * Math.max(1, quantity);
  const priceParts = splitUsdForDisplay(unitAmount);
  const stockDisplay = pdpStockLabel(product.stock);

  const overviewIndex = showBomTab ? 1 : 0;
  const specsIndex = showBomTab ? 2 : 1;

  const handleAddToCart = () => {
    if (isBomOnly || discontinued) return;
    if (hasKitConfigurator) {
      addQuantity(
        product,
        quantity,
        createDefaultBomSelection(product) ?? undefined
      );
    } else {
      addQuantity(product, quantity);
    }
  };

  const switchToReplacement = () => {
    if (!replacement) return;
    navigate(productDetailPath(replacement));
  };
  const goGallery = (delta: -1 | 1) => {
    if (gallery.length === 0) return;
    setActiveImage(
      (prev) => (prev + delta + gallery.length) % gallery.length
    );
  };

  return (
    <div className="product-detail-page">
      <div className="page-container py-8 pb-28">
        <ModusWcButton
          className="cart-text-link-host mb-6 w-fit"
          color="primary"
          variant="borderless"
          size="sm"
          customClass="cart-text-link"
          aria-label="Back to catalog"
          onButtonClick={() => navigate('/catalog')}
        >
          <ModusWcIcon name="arrow_left" size="xs" decorative />
          Back to catalog
        </ModusWcButton>

        {discontinued && replacement ? (
          <div className="mb-6">
            <DiscontinuedBanner
              discontinuedDate={product.discontinuationDate ?? 'an earlier date'}
              replacementPn={replacement.partNumber}
              replacementTitle={replacement.name}
              onViewReplacement={switchToReplacement}
            />
          </div>
        ) : null}

        {discontinued && !replacement ? (
          <div className="mb-6">
            <ModusWcAlert
              variant="error"
              icon="alert"
              role="status"
              customClass="product-discontinued-alert"
              alertTitle={`This item was discontinued on ${product.discontinuationDate ?? 'an earlier date'}.`}
              alertDescription="No direct replacement is available."
            />
          </div>
        ) : null}

        {!discontinued && legacyReplaced.length > 0 ? (
          <div className="mb-6">
            <ReplacementNoticeBanner
              replaces={legacyReplaced.map((p) => ({
                pn: p.partNumber,
                title: p.name,
              }))}
            />
          </div>
        ) : null}

        <div className="page-grid product-detail-hero">
          {/* Gallery */}
          <div className="page-col-12 page-col-lg-6 flex flex-col gap-3">
            <div className="product-detail-stage">
              <ProductImage
                src={gallery[activeImage] ?? product.image}
                alt={product.name}
              />
              <div className="product-detail-stage-chrome">
                <ModusWcTypography
                  hierarchy="p"
                  size="xs"
                  customClass="product-detail-caption"
                  label={product.name}
                />
                <div className="product-detail-stage-nav">
                  <ModusWcButton
                    color="tertiary"
                    variant="borderless"
                    shape="square"
                    size="sm"
                    aria-label="Previous image"
                    onButtonClick={() => goGallery(-1)}
                  >
                    <ModusWcIcon name="chevron_left" size="sm" decorative />
                  </ModusWcButton>
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    weight="semibold"
                    label={`${activeImage + 1}/${gallery.length || 1}`}
                  />
                  <ModusWcButton
                    color="tertiary"
                    variant="borderless"
                    shape="square"
                    size="sm"
                    aria-label="Next image"
                    onButtonClick={() => goGallery(1)}
                  >
                    <ModusWcIcon name="chevron_right" size="sm" decorative />
                  </ModusWcButton>
                </div>
              </div>
            </div>

            <ul className="product-detail-thumbs" aria-label="Product images">
              {gallery.map((src, index) => (
                <li key={`${src}-${index}`}>
                  <button
                    type="button"
                    className={
                      index === activeImage
                        ? 'product-detail-thumb product-detail-thumb--active'
                        : 'product-detail-thumb'
                    }
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === activeImage ? 'true' : undefined}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Buy box */}
          <div className="page-col-12 page-col-lg-6">
            <div className="product-detail-buy-box">
              <div className="product-detail-buy-header">
                {!isBomOnly ? (
                  <div className="product-detail-type-badge">
                    {isKit ? (
                      <ModusWcBadge variant="filled" color="high-contrast" size="sm">
                        {`BUNDLED KIT · ${universalBom.length} COMMERCIAL PARTS`}
                      </ModusWcBadge>
                    ) : (
                      <ModusWcBadge variant="outlined" color="tertiary" size="sm">
                        HARDWARE UNIT
                      </ModusWcBadge>
                    )}
                  </div>
                ) : null}
                <ModusWcTypography
                  hierarchy="h1"
                  size="2xl"
                  weight="semibold"
                  customClass="product-detail-buy-title"
                  label={product.name}
                />
                <ModusWcTypography
                  hierarchy="p"
                  size="sm"
                  customClass="product-detail-buy-pn"
                  label={`PN: ${product.partNumber}`}
                />
                {discontinued ? (
                  <DiscontinuedBadge />
                ) : null}
                {isBomOnly ? (
                  <ModusWcBadge variant="outlined" color="tertiary" size="sm">
                    Kit component
                  </ModusWcBadge>
                ) : null}
                <ModusWcTypography
                  hierarchy="p"
                  size="md"
                  customClass="product-detail-buy-description"
                  label={product.description}
                />
              </div>

              <div className="product-detail-discounts" hidden={discontinued}>
                <div className="product-detail-discount-block">
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    weight="semibold"
                    label="Dealer discount"
                  />
                  <div className="product-detail-discount-line">
                    <ModusWcIcon name="tag" size="sm" decorative />
                    <ModusWcCheckbox
                      size="sm"
                      name="dealer-discount"
                      inputId="dealer-discount"
                      label={`${Math.round(DEALER_DISCOUNT_RATE * 100)}% (${formatUsd(dealerOff)} off listing price)`}
                      value={dealerDiscount}
                      disabled={discontinued}
                      onInputChange={(e: CustomEvent) =>
                        setDealerDiscount(readInputChecked(e))
                      }
                    />
                  </div>
                </div>
                <div className="product-detail-discount-block">
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    weight="semibold"
                    label="KPI discount"
                  />
                  <div className="product-detail-discount-line">
                    <ModusWcIcon name="tag" size="sm" decorative />
                    <ModusWcCheckbox
                      size="sm"
                      name="kpi-discount"
                      inputId="kpi-discount"
                      label={`${Math.round(KPI_DISCOUNT_RATE * 100)}% (${formatUsd(kpiOff)} off listing price)`}
                      value={kpiDiscount}
                      disabled={discontinued}
                      onInputChange={(e: CustomEvent) =>
                        setKpiDiscount(readInputChecked(e))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="product-detail-buy-pricing">
                <div className="product-detail-price-row">
                  <p
                    className={
                      discontinued
                        ? 'product-detail-price-hero product-detail-price-hero--muted'
                        : 'product-detail-price-hero'
                    }
                    aria-label={formatCatalogPrice(unitAmount)}
                  >
                    <span className="product-detail-price-dollars">
                      {priceParts.dollars}
                    </span>
                    <sup className="product-detail-price-cents">
                      {priceParts.cents}
                    </sup>
                  </p>
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    customClass="product-detail-list-price"
                    label={`List price: ${formatCatalogPrice(listAmount)}`}
                  />
                </div>
                {bundleSavings ? (
                  <ModusWcTypography
                    hierarchy="p"
                    size="sm"
                    weight="semibold"
                    customClass="product-detail-bundle-savings"
                    label={`${formatUsd(unitAmount)} Net (Bundled pricing — Saves ${formatUsd(bundleSavings)} vs. buying parts separately)`}
                  />
                ) : null}
                {stockDisplay ? (
                  <div className="product-detail-stock">
                    <ModusWcIcon
                      name={stockDisplay.icon}
                      size="sm"
                      decorative
                      customClass={`product-detail-stock-icon product-detail-stock-icon--${stockDisplay.color}`}
                    />
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      weight="semibold"
                      customClass={`product-detail-stock-label product-detail-stock-label--${stockDisplay.color}`}
                      label={stockDisplay.label}
                    />
                  </div>
                ) : null}
              </div>

              {!isBomOnly && !discontinued ? (
                <div className="product-detail-buy-actions">
                  <div className="product-detail-buy-qty-row">
                    <ModusWcTypography
                      hierarchy="p"
                      size="md"
                      weight="semibold"
                      customClass="product-detail-buy-qty-label"
                      label="Quantity"
                    />
                    <div className="qty-stepper product-detail-buy-stepper">
                      <ModusWcButton
                        variant="borderless"
                        color="tertiary"
                        shape="square"
                        size="sm"
                        aria-label="Decrease quantity"
                        onButtonClick={() =>
                          setQuantity((q) => Math.max(1, q - 1))
                        }
                      >
                        <ModusWcIcon name="remove" size="xs" decorative />
                      </ModusWcButton>
                      <div className="cart-qty-field product-detail-buy-qty-field">
                        <ModusWcNumberInput
                          aria-label="Quantity"
                          size="sm"
                          min={1}
                          step={1}
                          value={String(quantity)}
                          onInputChange={(e: CustomEvent) => {
                            const next = Number(readInputString(e));
                            if (!Number.isNaN(next)) {
                              setQuantity(Math.max(1, Math.floor(next)));
                            }
                          }}
                        />
                      </div>
                      <ModusWcButton
                        variant="borderless"
                        color="tertiary"
                        shape="square"
                        size="sm"
                        aria-label="Increase quantity"
                        onButtonClick={() => setQuantity((q) => q + 1)}
                      >
                        <ModusWcIcon name="add" size="xs" decorative />
                      </ModusWcButton>
                    </div>
                  </div>

                  <ModusWcButton
                    color="primary"
                    variant="filled"
                    size="md"
                    fullWidth
                    customClass="product-detail-atc"
                    aria-label={`Add ${product.name} to cart`}
                    onButtonClick={handleAddToCart}
                  >
                    <ModusWcIcon name="shopping_cart" size="sm" decorative />
                    Add to cart
                  </ModusWcButton>

                  {isKit ? (
                    <ModusWcAlert
                      variant="info"
                      icon="info"
                      role="note"
                      customClass="product-detail-receiving-note"
                      alertTitle="Ordering & receiving note"
                      alertDescription={`Billed as 1 kit SKU (PN: ${product.partNumber}) on your invoice. Explodes into individual component line items (.1, .2, .3) on digital packout lists for warehouse receiving.`}
                    />
                  ) : null}
                </div>
              ) : null}

              {!isBomOnly && discontinued ? (
                <div className="product-detail-buy-actions">
                  <ModusWcButton
                    color="primary"
                    variant="filled"
                    size="md"
                    fullWidth
                    disabled
                    customClass="product-detail-atc"
                    aria-label={`${product.name} is discontinued and cannot be added to the cart`}
                  >
                    Item discontinued — cannot add to cart
                  </ModusWcButton>
                </div>
              ) : null}

              <div className="product-detail-buy-help">
                <ModusWcDivider />
                <p className="product-detail-buy-help-text">
                  If you need help with your purchase, contact the{' '}
                  <ModusWcButton
                    className="product-detail-help-link-host"
                    color="primary"
                    variant="borderless"
                    size="sm"
                    customClass="product-detail-help-link"
                    aria-label="Open Trimble Help Center in a new tab"
                    onButtonClick={() =>
                      window.open(
                        'https://help.trimble.com',
                        '_blank',
                        'noopener'
                      )
                    }
                  >
                    Help Center
                  </ModusWcButton>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="product-detail-tabs mt-10">
          <ModusWcTabs
            size="md"
            tabStyle="bordered"
            tabs={tabs}
            activeTabIndex={activeTab}
            aria-label="Product details"
            onTabChange={(
              e: CustomEvent<{ previousTab: number; newTab: number }>
            ) => setActiveTab(e.detail.newTab)}
          />

          {showBomTab ? (
            <div
              id={BOM_SECTION_DOM_ID}
              className="product-detail-tab-panel"
              hidden={activeTab !== 0}
              aria-hidden={activeTab !== 0}
            >
              <ProductDetailBomSection
                product={product}
                expanded={bomOpen}
                onExpandedChange={setBomOpen}
                onAddSpare={(spare) => addQuantity(spare, 1)}
              />
            </div>
          ) : null}

          <div
            className="product-detail-tab-panel"
            hidden={activeTab !== overviewIndex}
            aria-hidden={activeTab !== overviewIndex}
          >
            <ProductOverviewTabContent
              product={product}
              related={related}
              onAddToCart={addItem}
            />
          </div>

          <div
            className="product-detail-tab-panel"
            hidden={activeTab !== specsIndex}
            aria-hidden={activeTab !== specsIndex}
          >
            <div className="flex max-w-3xl flex-col gap-3 py-4">
              <ModusWcTypography
                hierarchy="h2"
                size="lg"
                weight="semibold"
                label="Specifications"
              />
              <dl className="product-detail-specs">
                <div>
                  <dt>Part number</dt>
                  <dd className="part-number">{product.partNumber}</dd>
                </div>
                <div>
                  <dt>Stock</dt>
                  <dd>{product.stock.replace(/-/g, ' ')}</dd>
                </div>
                {Object.entries(product.facets).map(([key, values]) => (
                  <div key={key}>
                    <dt>{key.replace(/-/g, ' ')}</dt>
                    <dd>{values.join(', ')}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {!isBomOnly && !discontinued ? (
        <div className="product-detail-sticky-footer" role="region" aria-label="Order summary">
          <div className="page-container product-detail-sticky-inner">
            <ModusWcTypography
              hierarchy="p"
              size="md"
              weight="semibold"
              label={`Total price: ${formatUsd(lineTotal)}`}
            />
            <ModusWcButton
              color="tertiary"
              variant="outlined"
              size="sm"
              aria-label="Add selection to cart"
              onButtonClick={handleAddToCart}
            >
              <ModusWcIcon name="shopping_cart" size="xs" decorative />
              Add selection to cart
            </ModusWcButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
