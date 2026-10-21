import { useState } from 'react';
import {
  ModusWcButton,
  ModusWcCheckbox,
  ModusWcCollapse,
  ModusWcRadio,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { filterGroups } from '../catalogData';
import { readInputChecked } from '../utils/modusFormEvents';

export type FilterSelection = Record<string, string[]>;

/** Selection key/value for the "Show kits only" toggle (bundled kit SKUs). */
export const KITS_ONLY_KEY = 'kits-only';
export const KITS_ONLY_VALUE = 'true';

export function isKitsOnly(selected: FilterSelection): boolean {
  return (selected[KITS_ONLY_KEY] ?? []).includes(KITS_ONLY_VALUE);
}

interface FilterPanelProps {
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

export default function FilterPanel({
  selected,
  onChange,
  onClear,
  hasActiveFilters,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(filterGroups.map((g) => [g.id, true]))
  );

  return (
    <aside aria-label="Product filters" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <ModusWcTypography
          hierarchy="h2"
          size="2xl"
          weight="bold"
          customClass="leading-8"
          label="Filters"
        />
        <ModusWcButton
          className="cart-text-link-host"
          color="primary"
          variant="borderless"
          size="sm"
          customClass="cart-text-link"
          disabled={!hasActiveFilters}
          aria-label="Clear all filters"
          onButtonClick={onClear}
        >
          Clear all
        </ModusWcButton>
      </div>

      <div className="filter-kits-only">
        <ModusWcCheckbox
          label="Show kits only"
          value={isKitsOnly(selected)}
          onInputChange={(e: CustomEvent) =>
            onChange(
              KITS_ONLY_KEY,
              KITS_ONLY_VALUE,
              'checkbox',
              readInputChecked(e)
            )
          }
        />
      </div>

      <div className="filter-sections">
        {filterGroups.map((group) => (
          <div key={group.id} className="filter-section">
            <ModusWcCollapse
              bordered={false}
              options={{ title: group.heading, size: 'md' }}
              expanded={expanded[group.id]}
              onExpandedChange={(e: CustomEvent<{ expanded: boolean }>) =>
                setExpanded((prev) => ({ ...prev, [group.id]: e.detail.expanded }))
              }
            >
              <div slot="content" className="flex flex-col gap-2.5 px-1 pb-3">
                {group.type === 'radio'
                  ? group.options.map((option) => (
                      <ModusWcRadio
                        key={option.value}
                        name={group.id}
                        label={option.label}
                        value={(selected[group.id] ?? []).includes(option.value)}
                        onInputChange={(e: CustomEvent) => {
                          if (readInputChecked(e)) onChange(group.id, option.value, 'radio', true);
                        }}
                      />
                    ))
                  : group.options.map((option) => (
                      <ModusWcCheckbox
                        key={option.value}
                        label={option.label}
                        value={(selected[group.id] ?? []).includes(option.value)}
                        onInputChange={(e: CustomEvent) =>
                          onChange(group.id, option.value, 'checkbox', readInputChecked(e))
                        }
                      />
                    ))}
              </div>
            </ModusWcCollapse>
          </div>
        ))}
      </div>
    </aside>
  );
}
