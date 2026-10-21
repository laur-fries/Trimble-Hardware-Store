import { useEffect, useState } from 'react';
import {
  ModusWcAlert,
  ModusWcCard,
  ModusWcCheckbox,
  ModusWcTextarea,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import {
  SPECIAL_SHIPPING_NOTES_MAX_LENGTH,
  type SpecialShippingInstructionsState,
} from '../../checkout/specialShippingInstructions';
import { readInputChecked, readInputString } from '../../utils/modusFormEvents';

export interface SpecialShippingInstructionsCardProps {
  /** Syncs progressive-disclosure state to checkout order payload / validation. */
  onStateChange?: (state: SpecialShippingInstructionsState) => void;
  /** Set when checkout submit is blocked for empty required notes. */
  showNotesValidationError?: boolean;
}

function buildState(
  isSpecialShippingSelected: boolean,
  instructionsText: string
): SpecialShippingInstructionsState {
  const hasAgreedToHold = isSpecialShippingSelected;

  return {
    isSpecialShippingSelected,
    hasAgreedToHold,
    instructionsText,
    hasSpecialInstructions:
      isSpecialShippingSelected && instructionsText.trim().length > 0,
    orderHoldStatus: isSpecialShippingSelected
      ? 'MANUAL_SHIPPING_HOLD'
      : 'NONE',
  };
}

/**
 * Single-checkbox special shipping hold: opt-in reveals warning + required notes.
 */
export default function SpecialShippingInstructionsCard({
  onStateChange,
  showNotesValidationError = false,
}: SpecialShippingInstructionsCardProps) {
  const [isSpecialShippingSelected, setIsSpecialShippingSelected] =
    useState(false);
  const [instructionsText, setInstructionsText] = useState('');

  useEffect(() => {
    onStateChange?.(buildState(isSpecialShippingSelected, instructionsText));
  }, [isSpecialShippingSelected, instructionsText, onStateChange]);

  const handleOptInChange = (checked: boolean) => {
    if (!checked) {
      setIsSpecialShippingSelected(false);
      setInstructionsText('');
      return;
    }
    setIsSpecialShippingSelected(true);
  };

  const handleNotesChange = (value: string) => {
    setInstructionsText(value.slice(0, SPECIAL_SHIPPING_NOTES_MAX_LENGTH));
  };

  const charCount = instructionsText.length;
  const notesMissing =
    isSpecialShippingSelected && !instructionsText.trim();
  const showNotesError = showNotesValidationError && notesMissing;

  return (
    <ModusWcCard bordered={true} padding="compact">
      <div slot="title">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Special shipping instructions (optional)"
        />
      </div>

      <div className="flex flex-col gap-4 px-1 pb-1 pt-2">
        <ModusWcCheckbox
          size="sm"
          name="special-shipping-opt-in"
          inputId="special-shipping-opt-in"
          label="Request special or non-standard shipping instructions"
          value={isSpecialShippingSelected}
          onInputChange={(e: CustomEvent) =>
            handleOptInChange(readInputChecked(e))
          }
        />

        <div
          className={
            isSpecialShippingSelected
              ? 'special-shipping-details flex flex-col gap-4'
              : 'special-shipping-details'
          }
          hidden={!isSpecialShippingSelected}
          aria-hidden={!isSpecialShippingSelected}
        >
          <ModusWcAlert
            variant="warning"
            icon="warning"
            alertDescription="Requesting non-standard shipping places your order on manual hold for review by Trimble Operations and may delay fulfillment by 24–48 hours."
            role="alert"
          />

          <div className="flex flex-col gap-1">
            <ModusWcTextarea
              label="Special Shipping Instructions"
              placeholder="e.g., Receiving dock open 8 AM - 3 PM only. Requires liftgate upon delivery."
              required
              rows={4}
              maxLength={SPECIAL_SHIPPING_NOTES_MAX_LENGTH}
              value={instructionsText}
              inputId="special-shipping-notes"
              disabled={!isSpecialShippingSelected}
              feedback={
                showNotesError
                  ? {
                      level: 'error',
                      message: 'Enter special shipping instructions.',
                    }
                  : undefined
              }
              onInputChange={(e: CustomEvent) =>
                handleNotesChange(readInputString(e))
              }
            />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <ModusWcTypography
                hierarchy="p"
                size="xs"
                customClass="min-w-0 flex-1 text-[var(--modus-wc-color-base-content-low-contrast)]"
                label={`${charCount}/${SPECIAL_SHIPPING_NOTES_MAX_LENGTH} characters`}
              />
            </div>
          </div>
        </div>
      </div>
    </ModusWcCard>
  );
}
