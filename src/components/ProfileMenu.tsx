import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ModusWcAvatar,
  ModusWcButton,
  ModusWcCard,
  ModusWcDivider,
  ModusWcIcon,
  ModusWcMenu,
  ModusWcMenuItem,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { CURRENT_USER_TID } from '../da/types';

type ProfileMenuEntry = {
  value: string;
  label: string;
  icon: string;
  /** Route to open; entries without one are prototype placeholders. */
  path?: string;
};

const ACCOUNT_ENTRIES: ProfileMenuEntry[] = [
  { value: 'account', label: 'My account', icon: 'person' },
  { value: 'orders', label: 'Orders', icon: 'package', path: '/account/orders?tab=pending' },
  { value: 'favorites', label: 'Favorites', icon: 'heart' },
  { value: 'saved-lists', label: 'Saved lists', icon: 'list_bulleted' },
];

const ADMIN_ENTRIES: ProfileMenuEntry[] = [
  { value: 'direct-entry', label: 'Direct entry', icon: 'calculator' },
  { value: 'change-log', label: 'Change log', icon: 'sync' },
  { value: 'settings', label: 'Settings', icon: 'settings' },
  { value: 'sign-out', label: 'Sign out', icon: 'sign_out' },
];

const MANAGE_TRIMBLE_ID_URL = 'https://id.trimble.com';
const PANEL_GAP_PX = 8;

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Navbar profile menu. Replaces the built-in `modus-wc-navbar` user card,
 * which has no slot for custom entries. The panel portals to `<body>` so the
 * navbar toolbar layout cannot clip or reflow it.
 */
export default function ProfileMenu({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const user = CURRENT_USER_TID;
  const initials = initialsFor(user.name);

  const measure = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor({
      top: rect.bottom + PANEL_GAP_PX,
      right: Math.max(PANEL_GAP_PX, window.innerWidth - rect.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.querySelector('button')?.focus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const selectEntry = (entry: ProfileMenuEntry) => {
    setOpen(false);
    if (!entry.path) return;
    onNavigate?.();
    navigate(entry.path);
  };

  const isSelected = (entry: ProfileMenuEntry) =>
    entry.value === 'orders' && location.pathname.startsWith('/account/orders');

  const renderEntries = (entries: ProfileMenuEntry[]) =>
    entries.map((entry) => (
      <ModusWcMenuItem
        key={entry.value}
        label={entry.label}
        value={entry.value}
        size="md"
        selected={isSelected(entry)}
        onItemSelect={() => selectEntry(entry)}
      >
        <ModusWcIcon
          slot="start-icon"
          name={entry.icon}
          variant="solid"
          size="sm"
          decorative
        />
      </ModusWcMenuItem>
    ));

  const panel =
    open && anchor
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            className="profile-menu-panel"
            style={{ top: anchor.top, right: anchor.right }}
            role="dialog"
            aria-label="Profile menu"
          >
            <ModusWcCard bordered={true} padding="compact" customClass="profile-menu-card">
              <div className="profile-menu-body">
                <div className="profile-menu-header">
                  <ModusWcAvatar
                    alt={user.name}
                    imgSrc=""
                    initials={initials}
                    size="lg"
                  />
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    customClass="profile-menu-muted"
                    label={user.accountName}
                  />
                  <ModusWcTypography
                    hierarchy="p"
                    size="md"
                    weight="semibold"
                    label={user.name}
                  />
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    customClass="profile-menu-muted"
                    label={user.email}
                  />
                  <a
                    href={MANAGE_TRIMBLE_ID_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-menu-manage-link"
                  >
                    Manage my Trimble ID
                  </a>
                </div>

                <ModusWcMenu bordered={false} size="md" customClass="profile-menu-list">
                  {renderEntries(ACCOUNT_ENTRIES)}
                </ModusWcMenu>

                <div className="profile-menu-section">
                  <ModusWcTypography
                    hierarchy="p"
                    size="xs"
                    weight="semibold"
                    customClass="profile-menu-muted"
                    label="Admin"
                  />
                  <ModusWcDivider />
                </div>

                <ModusWcMenu bordered={false} size="md" customClass="profile-menu-list">
                  {renderEntries(ADMIN_ENTRIES)}
                </ModusWcMenu>
              </div>
            </ModusWcCard>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={triggerRef} className="profile-menu">
      <ModusWcButton
        color="tertiary"
        variant="borderless"
        shape="circle"
        size="md"
        customClass="profile-menu-trigger"
        aria-label={`Open profile menu for ${user.name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onButtonClick={() => setOpen((prev) => !prev)}
      >
        <ModusWcAvatar alt="" imgSrc="" initials={initials} size="sm" />
      </ModusWcButton>
      {panel}
    </div>
  );
}
