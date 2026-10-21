import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ModusWcBadge,
  ModusWcButton,
  ModusWcIcon,
  ModusWcNavbar,
  ModusWcTextInput,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { useCart } from '../cart/CartContext';
import { CURRENT_USER_TID } from '../da/types';
import { readInputString } from '../utils/modusFormEvents';
import ProfileMenu from './ProfileMenu';

const SEARCH_DEBOUNCE_MS = 120;

// Built-in search and user controls render after the `end` slot and the user
// card can't host custom entries, so search → cart → profile live in `end`.
const visibility = {
  ai: false,
  apps: false,
  help: false,
  logo: true,
  mainMenu: false,
  notifications: false,
  search: false,
  searchInput: false,
  user: false,
};

const userCard = {
  name: CURRENT_USER_TID.name,
  email: CURRENT_USER_TID.email,
  avatarAlt: CURRENT_USER_TID.name,
};

export default function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { count, closeCart } = useCart();
  const urlQuery = location.pathname === '/catalog' ? searchParams.get('q') ?? '' : '';
  const [searchValue, setSearchValue] = useState(urlQuery);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setSearchValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  const goToCatalogSearch = (raw: string) => {
    const q = raw.trim();
    closeCart();
    const path = q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog';
    navigate(path, { replace: location.pathname === '/catalog' });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(
      () => goToCatalogSearch(value),
      SEARCH_DEBOUNCE_MS
    );
  };

  const handleCartClick = () => {
    closeCart();
    navigate('/cart');
  };

  return (
    <ModusWcNavbar
      customClass="app-navbar"
      logoName="trimble"
      visibility={visibility}
      userCard={userCard}
      onTrimbleLogoClick={() => navigate('/')}
    >
      <div slot="start" className="flex items-center">
        <ModusWcTypography
          hierarchy="p"
          size="md"
          weight="semibold"
          label="Hardware Store"
        />
      </div>

      <div slot="end" className="app-navbar-end">
        <div className="app-navbar-search" role="search">
          <ModusWcTextInput
            aria-label="Search products, part numbers, and SKUs"
            placeholder="Search"
            type="search"
            enterkeyhint="search"
            size="md"
            includeSearch
            value={searchValue}
            onInputChange={(e: CustomEvent) => handleSearchChange(readInputString(e))}
          />
        </div>

        <div className="cart-button">
          <ModusWcButton
            color="tertiary"
            variant="borderless"
            size="md"
            shape="square"
            aria-label={count > 0 ? `View cart, ${count} items` : 'View cart'}
            onButtonClick={handleCartClick}
          >
            <ModusWcIcon name="shopping_cart" size="sm" decorative />
          </ModusWcButton>
          {count > 0 ? (
            <span className="cart-badge" aria-hidden="true">
              <ModusWcBadge color="danger" size="sm" variant="counter">
                {count > 99 ? '99+' : String(count)}
              </ModusWcBadge>
            </span>
          ) : null}
        </div>

        <ProfileMenu onNavigate={closeCart} />
      </div>
    </ModusWcNavbar>
  );
}
