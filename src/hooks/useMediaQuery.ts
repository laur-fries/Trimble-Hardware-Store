import { useEffect, useState } from 'react';

/** Subscribe to a CSS media query; SSR-safe default is `false`. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/** Shop Hardware layout breakpoints (match `index.css` shop-hardware rules). */
export const SHOP_DESKTOP_MQ = '(min-width: 1200px)';
export const SHOP_TABLET_MQ =
  '(min-width: 768px) and (max-width: 1199px)';
export const SHOP_TABLET_UP_MQ = '(min-width: 768px)';
export const SHOP_MOBILE_MQ = '(max-width: 767px)';
/** Sticky cart footer band (md / sm / xs). */
export const SHOP_COMPACT_MQ = '(max-width: 1199px)';
/** Checkout tablet portrait sticky bar (768px–1023px). */
export const CHECKOUT_TABLET_MQ =
  '(min-width: 768px) and (max-width: 1023px)';
export const CHECKOUT_MOBILE_MQ = '(max-width: 767px)';
