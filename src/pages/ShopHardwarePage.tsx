import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcPagination,
  ModusWcSelect,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import FilterPanel, {
  isKitsOnly,
  type FilterSelection,
} from '../components/FilterPanel';
import ProductCard from '../components/ProductCard';
import FilterDrawer from '../components/shop/FilterDrawer';
import MobileCartBar from '../components/shop/MobileCartBar';
import ShopCartRail from '../components/shop/ShopCartRail';
import {
  ALL_OPTION,
  catalogProducts,
  filterGroups,
  parsePrice,
  sortOptions,
} from '../catalogData';
import { searchCatalogProducts } from '../catalog/searchProducts';
import { useCart } from '../cart/CartContext';
import {
  SHOP_DESKTOP_MQ,
  useMediaQuery,
} from '../hooks/useMediaQuery';
import { readInputString } from '../utils/modusFormEvents';

const DEFAULT_SELECTION: FilterSelection = { industry: [ALL_OPTION] };
const PAGE_SIZE = 9;

interface CatalogLocationState {
  industry?: string;
}

/**
 * Shop Hardware — responsive catalog:
 * Desktop ≥1200: filters | products | cart rail
 * Tablet 768–1199: filter drawer + 2-col products (cart via header drawer)
 * Mobile &lt;768: filter button + 1-col products + sticky cart bar
 */
export default function ShopHardwarePage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const industryFromNav = (location.state as CatalogLocationState | null)
    ?.industry;
  const searchQuery = (searchParams.get('q') ?? '').trim();
  const isDesktop = useMediaQuery(SHOP_DESKTOP_MQ);
  const { items: cartItems } = useCart();
  const hasCartItems = cartItems.length > 0;

  const [sort, setSort] = useState('featured');
  const [selected, setSelected] = useState<FilterSelection>(() =>
    industryFromNav
      ? { industry: [industryFromNav] }
      : DEFAULT_SELECTION
  );
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    addItem,
    addQuantity,
    items,
    increment,
    decrement,
    removeItem,
    closeCart,
  } = useCart();

  useEffect(() => {
    if (!industryFromNav) return;
    setSelected({ industry: [industryFromNav] });
    setPage(1);
  }, [industryFromNav]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (isDesktop) {
      setFiltersOpen(false);
      closeCart();
    }
  }, [isDesktop, closeCart]);

  const hasActiveFilters = useMemo(
    () =>
      Object.values(selected).some((values) =>
        values.some((value) => value !== ALL_OPTION)
      ),
    [selected]
  );

  const handleFilterChange = (
    groupId: string,
    option: string,
    type: 'radio' | 'checkbox',
    checked: boolean
  ) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      let next: string[];
      if (type === 'radio') {
        next = checked ? [option] : current.filter((o) => o !== option);
      } else {
        next = checked
          ? [...current, option]
          : current.filter((o) => o !== option);
      }
      return { ...prev, [groupId]: next };
    });
  };

  const clearAll = () => setSelected(DEFAULT_SELECTION);

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const visibleProducts = useMemo(() => {
    const searchPool = searchQuery
      ? searchCatalogProducts(searchQuery, catalogProducts)
      : catalogProducts;

    const kitsOnly = isKitsOnly(selected);
    const filtered = searchPool.filter((product) =>
      (!kitsOnly || Boolean(product.isKit)) &&
      filterGroups.every((group) => {
        const chosen = (selected[group.id] ?? []).filter(
          (value) => value !== ALL_OPTION
        );
        if (chosen.length === 0) return true;
        const productValues = product.facets[group.id] ?? [];
        return chosen.some((value) => productValues.includes(value));
      })
    );

    const sorted = [...filtered];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case 'price-desc':
        sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return sorted;
  }, [selected, sort, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [selected, sort]);

  const totalResults = visibleProducts.length;
  const usePagination = !searchQuery;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = usePagination ? (currentPage - 1) * PAGE_SIZE : 0;
  const pageProducts = usePagination
    ? visibleProducts.slice(startIndex, startIndex + PAGE_SIZE)
    : visibleProducts;
  const firstShown = totalResults === 0 ? 0 : startIndex + 1;
  const lastShown = usePagination
    ? Math.min(startIndex + PAGE_SIZE, totalResults)
    : totalResults;

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartQtyById = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of items) map.set(line.product.id, line.quantity);
    return map;
  }, [items]);

  return (
    <div className="shop-hardware page-container py-6 sm:py-8">
      <div className="shop-hardware-header mb-4 flex flex-wrap items-center justify-between gap-3">
        <ModusWcTypography
          hierarchy="h1"
          size="3xl"
          weight="normal"
          label="Shop Hardware"
        />
        <div className="shop-hardware-desktop-sort w-full sm:w-64">
          <ModusWcSelect
            aria-label="Sort products"
            size="sm"
            value={sort}
            options={sortOptions}
            onInputChange={(e: CustomEvent) => setSort(readInputString(e))}
          />
        </div>
      </div>

      {/* Tablet / mobile filter & sort toolbar */}
      <div className="shop-hardware-toolbar mb-4">
        <ModusWcButton
          color="tertiary"
          variant="outlined"
          size="md"
          customClass="shop-filter-trigger"
          aria-label="Open filters and sort"
          aria-expanded={filtersOpen}
          onButtonClick={() => setFiltersOpen(true)}
        >
          <ModusWcIcon name="filter" size="sm" decorative />
          <span className="shop-filter-trigger-label-full">Filter & Sort</span>
          <span className="shop-filter-trigger-label-short">Filter</span>
          {hasActiveFilters ? (
            <span className="shop-filter-trigger-dot" aria-hidden="true" />
          ) : null}
        </ModusWcButton>
        <div className="shop-hardware-toolbar-sort min-w-0 flex-1">
          <ModusWcSelect
            aria-label="Sort products"
            size="sm"
            value={sort}
            options={sortOptions}
            onInputChange={(e: CustomEvent) => setSort(readInputString(e))}
          />
        </div>
      </div>

      {searchQuery ? (
        <div
          className="catalog-search-filter mb-6 flex flex-wrap items-center justify-between gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <ModusWcTypography
              hierarchy="p"
              size="md"
              weight="semibold"
              label={`Search results for “${searchQuery}”`}
            />
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label={
                totalResults === 0
                  ? 'No products match this search'
                  : `${totalResults} ${
                      totalResults === 1 ? 'product' : 'products'
                    } found`
              }
            />
          </div>
          <ModusWcButton
            color="tertiary"
            variant="outlined"
            size="sm"
            aria-label="Clear search filter"
            onButtonClick={clearSearch}
          >
            <ModusWcIcon name="close" size="xs" decorative />
            Clear search
          </ModusWcButton>
        </div>
      ) : null}

      <div
        className={`shop-hardware-layout${hasCartItems ? ' shop-hardware-layout--has-cart' : ''}`}
      >
        <div className="shop-hardware-filters">
          <FilterPanel
            selected={selected}
            onChange={handleFilterChange}
            onClear={clearAll}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div className="shop-hardware-products flex min-w-0 flex-col gap-4">
          {!searchQuery ? (
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              label={
                totalResults === 0
                  ? '0 results'
                  : `Showing ${firstShown}–${lastShown} of ${totalResults} ${
                      totalResults === 1 ? 'result' : 'results'
                    }`
              }
            />
          ) : null}

          {totalResults > 0 ? (
            <>
              <div className="shop-product-grid">
                {pageProducts.map((product) => {
                  const qty = cartQtyById.get(product.id) ?? 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQuantity={qty}
                      onAddToCart={addItem}
                      onIncrement={() =>
                        qty > 0
                          ? increment(product.id)
                          : addQuantity(product, 1)
                      }
                      onDecrement={() => {
                        if (qty <= 1) removeItem(product.id);
                        else decrement(product.id);
                      }}
                    />
                  );
                })}
              </div>

              {usePagination && totalPages > 1 ? (
                <nav
                  aria-label="Catalog pagination"
                  className="mt-2 flex justify-center"
                >
                  <ModusWcPagination
                    count={totalPages}
                    page={currentPage}
                    size="md"
                    ariaLabelValues={{
                      firstPage: 'First page',
                      lastPage: 'Last page',
                      nextPage: 'Next page',
                      previousPage: 'Previous page',
                      page: 'Page {0}',
                    }}
                    onPageChange={(
                      e: CustomEvent<{ newPage: number; prevPage: number }>
                    ) => goToPage(e.detail.newPage)}
                  />
                </nav>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ModusWcIcon
                name="search"
                size="lg"
                aria-label="No results"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
              />
              <ModusWcTypography
                hierarchy="h3"
                size="lg"
                weight="semibold"
                label={
                  searchQuery
                    ? 'No products match your search'
                    : 'No products match your filters'
                }
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label={
                  searchQuery
                    ? 'Try another name or part number, or clear the search to browse the full catalog.'
                    : 'Try removing a filter or clearing all to see more results.'
                }
              />
              {searchQuery ? (
                <ModusWcButton
                  color="primary"
                  variant="filled"
                  size="sm"
                  aria-label="Clear search filter"
                  onButtonClick={clearSearch}
                >
                  <ModusWcIcon name="close" size="xs" decorative />
                  Clear search
                </ModusWcButton>
              ) : (
                <ModusWcButton
                  color="primary"
                  variant="filled"
                  size="sm"
                  aria-label="Clear all filters"
                  onButtonClick={clearAll}
                >
                  <ModusWcIcon name="close" size="xs" decorative />
                  Clear all filters
                </ModusWcButton>
              )}
            </div>
          )}
        </div>

        <div
          className={`shop-hardware-cart${hasCartItems ? ' shop-hardware-cart--visible' : ''}`}
        >
          <ShopCartRail />
        </div>
      </div>

      <FilterDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        selected={selected}
        onChange={handleFilterChange}
        onClear={clearAll}
        hasActiveFilters={hasActiveFilters}
      />

      <MobileCartBar />
    </div>
  );
}
