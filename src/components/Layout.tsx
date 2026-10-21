import { Outlet } from 'react-router-dom';
import AppNavbar from './AppNavbar';
import CartPanel from './CartPanel';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--modus-wc-color-base-page)]">
      <AppNavbar />
      {/* id is the push target for the cart utility panel */}
      <main id="app-main" className="flex-1">
        <Outlet />
      </main>
      <CartPanel />
    </div>
  );
}
