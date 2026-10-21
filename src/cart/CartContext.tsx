import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { catalogProducts, type CatalogProduct } from '../catalogData';
import { isDiscontinuedProduct } from '../catalog/discontinuation';
import {
  createDefaultBomSelection,
  getLineTotal,
  normalizeBomSelection,
  type BomLineSelection,
} from './bomHelpers';
import { resolveDemoPriceDelta } from './priceChanges';

export type { BomLineSelection };

export interface CartLine {
  product: CatalogProduct;
  quantity: number;
  /** Fulfillment / ship-to location id for this line. */
  shipToId?: string;
  /**
   * Signed dealer-net delta since the item was added (new − previous).
   * Positive = increased, negative = decreased. Surfaced in the cart-level alert.
   */
  priceDelta?: number;
  /**
   * Kit BOM unbundling state keyed by part number.
   * When omitted for a kit, all sub-components are treated as selected at catalog qty.
   */
  bomSelection?: Record<string, BomLineSelection>;
}

interface PersistedCartLine {
  productId: string;
  quantity: number;
  shipToId?: string;
  priceDelta?: number;
  bomSelection?: Record<string, BomLineSelection>;
}

interface CartContextValue {
  items: CartLine[];
  /** Total quantity across all lines (drives the navbar badge). */
  count: number;
  /** Sum of line totals (kit BOM–aware), in dollars. */
  subtotal: number;
  isOpen: boolean;
  /** Add one unit of a product; opens the cart panel. */
  addItem: (product: CatalogProduct) => void;
  /** Add `quantity` units (creates the line if missing); opens the cart panel. */
  addQuantity: (
    product: CatalogProduct,
    quantity: number,
    bomSelection?: Record<string, BomLineSelection>
  ) => void;
  /** Batch add for reorder / import flows (single state update). */
  addQuantities: (
    entries: { product: CatalogProduct; quantity: number }[]
  ) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  removeItems: (ids: string[]) => void;
  /**
   * Swap a discontinued line for its replacement SKU, keeping quantity.
   * Merges into an existing replacement line when already present.
   */
  replaceDiscontinuedItem: (
    discontinuedProductId: string,
    replacement: CatalogProduct
  ) => void;
  clearCart: () => void;
  setShipTo: (id: string, shipToId: string) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'trimble-hardware-store-cart-v4';

/** Format a dollar amount as USD currency (e.g. 3200 -> "$3,200.00"). */
export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Demo cart — two lines for cart/discontinued prototype (S7 + power kit). */
function buildDemoCart(): CartLine[] {
  const seed: Array<{ productId: string; quantity: number }> = [
    { productId: 'prod-3', quantity: 1 }, // S7 — discontinued
    { productId: 'prod-4', quantity: 1 }, // External power kit
  ];

  const lines: CartLine[] = [];
  for (const row of seed) {
    const product = catalogProducts.find((p) => p.id === row.productId);
    if (!product) continue;
    lines.push({
      product,
      quantity: row.quantity,
      shipToId: 'ca-warehouse',
      bomSelection: createDefaultBomSelection(product),
    });
  }
  return lines;
}

function loadPersistedCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // First visit only — never re-seed after the user clears the cart.
    if (raw == null) return buildDemoCart();
    const parsed = JSON.parse(raw) as PersistedCartLine[];
    if (!Array.isArray(parsed)) return buildDemoCart();
    const lines: CartLine[] = [];
    for (const row of parsed) {
      const product = catalogProducts.find((p) => p.id === row.productId);
      if (!product || !row.quantity || row.quantity < 1) continue;
      lines.push({
        product,
        quantity: Math.floor(row.quantity),
        shipToId: row.shipToId,
        priceDelta: row.priceDelta,
        bomSelection: normalizeBomSelection(
          product,
          row.bomSelection ?? createDefaultBomSelection(product) ?? {}
        ),
      });
    }
    return lines;
  } catch {
    return buildDemoCart();
  }
}

function persistCart(items: CartLine[]) {
  const payload: PersistedCartLine[] = items.map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
    shipToId: line.shipToId,
    priceDelta: line.priceDelta,
    bomSelection: line.bomSelection,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => loadPersistedCart());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    persistCart(items);
  }, [items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: CatalogProduct) => {
    if (isDiscontinuedProduct(product)) return;
    setItems((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      let next: CartLine[];
      if (existing) {
        next = prev.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      } else {
        const priceDelta = resolveDemoPriceDelta(product);
        next = [
          ...prev,
          {
            product,
            quantity: 1,
            shipToId: 'tx-yard',
            priceDelta,
            bomSelection: createDefaultBomSelection(product),
          },
        ];
      }
      if (prev.length === 0 && next.length > 0) {
        queueMicrotask(() => setIsOpen(true));
      }
      return next;
    });
  }, []);

  const addQuantity = useCallback(
    (
      product: CatalogProduct,
      quantity: number,
      bomSelection?: Record<string, BomLineSelection>
    ) => {
      if (isDiscontinuedProduct(product)) return;
      const addQty = Math.max(1, Math.floor(quantity) || 1);
      const nextBom =
        bomSelection != null
          ? normalizeBomSelection(product, bomSelection)
          : createDefaultBomSelection(product);
      setItems((prev) => {
        const existing = prev.find((line) => line.product.id === product.id);
        let next: CartLine[];
        if (existing) {
          next = prev.map((line) =>
            line.product.id === product.id
              ? {
                  ...line,
                  quantity: line.quantity + addQty,
                  bomSelection: nextBom ?? line.bomSelection,
                }
              : line
          );
        } else {
          next = [
            ...prev,
            {
              product,
              quantity: addQty,
              shipToId: 'tx-yard',
              priceDelta: resolveDemoPriceDelta(product),
              bomSelection: nextBom,
            },
          ];
        }
        if (prev.length === 0 && next.length > 0) {
          queueMicrotask(() => setIsOpen(true));
        }
        return next;
      });
    },
    []
  );

  const addQuantities = useCallback(
    (entries: { product: CatalogProduct; quantity: number }[]) => {
      const orderable = entries.filter(
        (entry) => !isDiscontinuedProduct(entry.product)
      );
      if (orderable.length === 0) return;
      setItems((prev) => {
        let next = prev;
        for (const entry of orderable) {
          const addQty = Math.max(1, Math.floor(entry.quantity) || 1);
          const existing = next.find(
            (line) => line.product.id === entry.product.id
          );
          if (existing) {
            next = next.map((line) =>
              line.product.id === entry.product.id
                ? { ...line, quantity: line.quantity + addQty }
                : line
            );
          } else {
            next = [
              ...next,
              {
                product: entry.product,
                quantity: addQty,
                shipToId: 'tx-yard',
                priceDelta: resolveDemoPriceDelta(entry.product),
                bomSelection: createDefaultBomSelection(entry.product),
              },
            ];
          }
        }
        if (prev.length === 0 && next.length > 0) {
          queueMicrotask(() => setIsOpen(true));
        }
        return next;
      });
    },
    []
  );

  const increment = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((line) =>
        line.product.id === id ? { ...line, quantity: line.quantity + 1 } : line
      )
    );
  }, []);

  const decrement = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((line) =>
        line.product.id === id
          ? { ...line, quantity: Math.max(1, line.quantity - 1) }
          : line
      )
    );
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const next = Math.max(1, Math.floor(quantity) || 1);
    setItems((prev) =>
      prev.map((line) =>
        line.product.id === id ? { ...line, quantity: next } : line
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((line) => line.product.id !== id));
  }, []);

  const removeItems = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((line) => !idSet.has(line.product.id)));
  }, []);

  const replaceDiscontinuedItem = useCallback(
    (discontinuedProductId: string, replacement: CatalogProduct) => {
      if (isDiscontinuedProduct(replacement)) return;
      setItems((prev) => {
        const legacy = prev.find(
          (line) => line.product.id === discontinuedProductId
        );
        if (!legacy) return prev;
        const without = prev.filter(
          (line) => line.product.id !== discontinuedProductId
        );
        const existing = without.find(
          (line) => line.product.id === replacement.id
        );
        if (existing) {
          return without.map((line) =>
            line.product.id === replacement.id
              ? { ...line, quantity: line.quantity + legacy.quantity }
              : line
          );
        }
        return [
          ...without,
          {
            product: replacement,
            quantity: legacy.quantity,
            shipToId: legacy.shipToId ?? 'tx-yard',
            priceDelta: resolveDemoPriceDelta(replacement),
            bomSelection: createDefaultBomSelection(replacement),
          },
        ];
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const setShipTo = useCallback((id: string, shipToId: string) => {
    setItems((prev) =>
      prev.map((line) =>
        line.product.id === id ? { ...line, shipToId } : line
      )
    );
  }, []);

  const count = useMemo(
    () => items.reduce((total, line) => total + line.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, line) => total + getLineTotal(line), 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      addItem,
      addQuantity,
      addQuantities,
      increment,
      decrement,
      setQuantity,
      removeItem,
      removeItems,
      replaceDiscontinuedItem,
      clearCart,
      setShipTo,
      openCart,
      closeCart,
    }),
    [
      items,
      count,
      subtotal,
      isOpen,
      addItem,
      addQuantity,
      addQuantities,
      increment,
      decrement,
      setQuantity,
      removeItem,
      removeItems,
      replaceDiscontinuedItem,
      clearCart,
      setShipTo,
      openCart,
      closeCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
