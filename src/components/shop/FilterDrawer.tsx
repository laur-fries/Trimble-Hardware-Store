import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTypography,
  ModusWcUtilityPanel,
} from '@trimble-oss/moduswebcomponents-react';
import FilterPanel, { type FilterSelection } from '../FilterPanel';

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: FilterSelection;
  onChange: (
    groupId: string,
    value: string,
    type: 'radio' | 'checkbox',
    checked: boolean
  ) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

/**
 * Off-canvas filter drawer for tablet/mobile Shop Hardware layouts.
 */
export default function FilterDrawer({
  open,
  onOpenChange,
  selected,
  onChange,
  onClear,
  hasActiveFilters,
}: FilterDrawerProps) {
  return (
    <div className="shop-filter-drawer-viewport">
      <div
        className="shop-filter-drawer-backdrop"
        hidden={!open}
        aria-hidden={!open}
        onClick={() => onOpenChange(false)}
      />
      <ModusWcUtilityPanel
        expanded={open}
        pushContent={false}
        customClass="shop-filter-drawer"
        aria-label="Filter and sort products"
        onPanelClosed={() => onOpenChange(false)}
      >
        <div
          slot="header"
          className="flex w-full items-center justify-between gap-2"
        >
          <ModusWcTypography
            hierarchy="h2"
            size="md"
            weight="semibold"
            label="Filter & Sort"
          />
          <ModusWcButton
            color="tertiary"
            variant="borderless"
            shape="square"
            size="sm"
            aria-label="Close filters"
            onButtonClick={() => onOpenChange(false)}
          >
            <ModusWcIcon name="close" size="sm" decorative />
          </ModusWcButton>
        </div>
        <div slot="body" className="shop-filter-drawer-body">
          <FilterPanel
            selected={selected}
            onChange={onChange}
            onClear={onClear}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
        <div
          slot="footer"
          className="flex justify-end gap-2"
        >
          <ModusWcButton
            color="tertiary"
            variant="outlined"
            size="sm"
            aria-label="Clear all filters"
            onButtonClick={onClear}
          >
            Clear
          </ModusWcButton>
          <ModusWcButton
            color="primary"
            variant="filled"
            size="sm"
            aria-label="Apply filters"
            onButtonClick={() => onOpenChange(false)}
          >
            <ModusWcIcon name="check" size="xs" decorative />
            Done
          </ModusWcButton>
        </div>
      </ModusWcUtilityPanel>
    </div>
  );
}
