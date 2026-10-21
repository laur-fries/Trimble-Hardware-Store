import { useMemo } from 'react';
import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcCheckbox,
  ModusWcIcon,
  ModusWcSelect,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';
import type { IInputFeedbackProp, ISelectOption } from '@trimble-oss/moduswebcomponents';
import type { Address, AddressCategory } from '../../checkout/checkoutData';
import { useAddressDeduplication } from '../../hooks/useAddressDeduplication';
import { readInputChecked, readInputString } from '../../utils/modusFormEvents';

export const COUNTRY_OPTIONS: ISelectOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' },
];

export const US_STATE_OPTIONS: ISelectOption[] = [
  { value: '', label: 'Select state' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export interface LocationFormValues {
  category: AddressCategory;
  nickname: string;
  street: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  setAsDefault: boolean;
}

export function emptyLocationForm(
  defaults?: Partial<LocationFormValues>
): LocationFormValues {
  return {
    category: 'dealership_branch_warehouse',
    nickname: '',
    street: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    setAsDefault: false,
    ...defaults,
  };
}

export function locationFormFromAddress(
  address: Address,
  isProfileDefault: boolean
): LocationFormValues {
  return {
    category: address.category,
    nickname: address.nickname,
    street: address.street,
    addressLine2: address.streetLine2 ?? '',
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country || 'US',
    setAsDefault: isProfileDefault,
  };
}

export type LocationFormFieldKey =
  | 'nickname'
  | 'street'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'country';

export function getLocationFormFieldErrors(
  form: LocationFormValues
): Partial<Record<LocationFormFieldKey, string>> {
  const errors: Partial<Record<LocationFormFieldKey, string>> = {};

  if (!form.nickname.trim()) {
    errors.nickname = 'Enter a location name.';
  }
  if (!form.street.trim()) {
    errors.street = 'Enter a street address.';
  }
  if (!form.city.trim()) {
    errors.city = 'Enter a city.';
  }
  if (!form.state.trim()) {
    errors.state =
      form.country === 'US' ? 'Select a state.' : 'Enter a state or province.';
  }
  if (!form.postalCode.trim()) {
    errors.postalCode = 'Enter a ZIP or postal code.';
  }
  if (!form.country) {
    errors.country = 'Select a country.';
  }

  return errors;
}

function locationFieldFeedback(
  showValidationErrors: boolean,
  message?: string
): IInputFeedbackProp | undefined {
  if (!showValidationErrors || !message) return undefined;
  return { level: 'error', message };
}

export function isLocationFormValid(form: LocationFormValues): boolean {
  return Object.keys(getLocationFormFieldErrors(form)).length === 0;
}

export interface EditLocationFormProps {
  mode: 'add' | 'edit';
  form: LocationFormValues;
  onChange: (next: LocationFormValues) => void;
  savedAddresses: Address[];
  excludeAddressId?: string | null;
  showValidationErrors?: boolean;
  onUseExisting: (matched: Address) => void;
  onSaveAnyway: () => void;
}

/**
 * Ship-to add/edit location fields — actions live in the modal footer.
 */
export default function EditLocationForm({
  mode,
  form,
  onChange,
  savedAddresses,
  excludeAddressId,
  showValidationErrors = false,
  onUseExisting,
  onSaveAnyway,
}: EditLocationFormProps) {
  const matchedAddress = useAddressDeduplication(
    form.street,
    form.postalCode,
    savedAddresses,
    excludeAddressId
  );

  const fieldErrors = useMemo(
    () => getLocationFormFieldErrors(form),
    [form]
  );

  const defaultCheckboxId =
    mode === 'edit'
      ? 'edit-location-set-default'
      : 'add-location-set-default';

  const patch = (partial: Partial<LocationFormValues>) =>
    onChange({ ...form, ...partial });

  return (
    <div className="edit-location-form shipment-add-location-form flex min-w-0 flex-col gap-4">
      <div className="shipment-add-location-field">
        <ModusWcTextInput
          size="sm"
          required
          label="Location name"
          placeholder="e.g. California Warehouse"
          value={form.nickname}
          feedback={locationFieldFeedback(
            showValidationErrors,
            fieldErrors.nickname
          )}
          onInputChange={(e: CustomEvent) =>
            patch({ nickname: readInputString(e) })
          }
        />
      </div>

      <div className="shipment-add-location-field">
        <ModusWcTextInput
          size="sm"
          required
          label="Address 1"
          placeholder="Street address"
          value={form.street}
          feedback={locationFieldFeedback(showValidationErrors, fieldErrors.street)}
          onInputChange={(e: CustomEvent) =>
            patch({ street: readInputString(e) })
          }
        />
      </div>

      <div className="shipment-add-location-field">
        <ModusWcTextInput
          size="sm"
          label="Address 2"
          placeholder="Suite, unit, or building (optional)"
          value={form.addressLine2}
          onInputChange={(e: CustomEvent) =>
            patch({ addressLine2: readInputString(e) })
          }
        />
      </div>

      <div className="edit-location-address-grid">
        <div className="shipment-add-location-field">
          <ModusWcTextInput
            size="sm"
            required
            label="City"
            value={form.city}
            feedback={locationFieldFeedback(showValidationErrors, fieldErrors.city)}
            onInputChange={(e: CustomEvent) =>
              patch({ city: readInputString(e) })
            }
          />
        </div>
        <div className="shipment-add-location-field">
          {form.country === 'US' ? (
            <ModusWcSelect
              size="sm"
              required
              label="State"
              options={US_STATE_OPTIONS}
              value={form.state}
              feedback={locationFieldFeedback(showValidationErrors, fieldErrors.state)}
              onInputChange={(e: CustomEvent) =>
                patch({ state: readInputString(e) })
              }
            />
          ) : (
            <ModusWcTextInput
              size="sm"
              required
              label="State"
              value={form.state}
              feedback={locationFieldFeedback(showValidationErrors, fieldErrors.state)}
              onInputChange={(e: CustomEvent) =>
                patch({ state: readInputString(e) })
              }
            />
          )}
        </div>
        <div className="shipment-add-location-field">
          <ModusWcTextInput
            size="sm"
            required
            label="ZIP/Postal code"
            value={form.postalCode}
            feedback={locationFieldFeedback(
              showValidationErrors,
              fieldErrors.postalCode
            )}
            onInputChange={(e: CustomEvent) =>
              patch({ postalCode: readInputString(e) })
            }
          />
        </div>
        <div className="shipment-add-location-field">
          <ModusWcSelect
            size="sm"
            required
            label="Country"
            options={COUNTRY_OPTIONS}
            value={form.country}
            feedback={locationFieldFeedback(showValidationErrors, fieldErrors.country)}
            onInputChange={(e: CustomEvent) => {
              const country = readInputString(e) || 'US';
              patch({
                country,
                state: country === 'US' ? form.state : form.state,
              });
            }}
          />
        </div>
      </div>

      <ModusWcCheckbox
        size="sm"
        name={defaultCheckboxId}
        inputId={defaultCheckboxId}
        label="Set as default shipping address"
        value={form.setAsDefault}
        onInputChange={(e: CustomEvent) =>
          patch({ setAsDefault: readInputChecked(e) })
        }
      />

      <div
        className="edit-location-duplicate"
        hidden={!matchedAddress}
        aria-hidden={!matchedAddress}
      >
        {matchedAddress ? (
          <ModusWcAlert
            variant="warning"
            icon="warning"
            alertTitle={`An existing location matching "${matchedAddress.nickname}" (${matchedAddress.street}) already exists in this account.`}
            customClass="edit-location-duplicate-alert"
          >
            <div slot="content" className="edit-location-duplicate-actions">
              <ModusWcButton
                color="tertiary"
                variant="outlined"
                size="sm"
                onButtonClick={() => onUseExisting(matchedAddress)}
              >
                Use existing location
              </ModusWcButton>
              <ModusWcButton
                color="primary"
                variant="filled"
                size="sm"
                onButtonClick={() => onSaveAnyway()}
              >
                <ModusWcIcon name="check" size="xs" decorative />
                Save anyway
              </ModusWcButton>
            </div>
          </ModusWcAlert>
        ) : null}
      </div>
    </div>
  );
}
