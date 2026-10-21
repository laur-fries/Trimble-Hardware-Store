import { useState } from 'react';
import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcFileDropzone,
  ModusWcIcon,
  ModusWcModal,
  ModusWcRadio,
  ModusWcTextInput,
  ModusWcTextarea,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { readInputChecked, readInputString } from '../../utils/modusFormEvents';
import type { DiscountType } from '../../da/types';

export const DA_REQUEST_MODAL_ID = 'da-request-modal';

const dialog = () =>
  document.getElementById(DA_REQUEST_MODAL_ID) as HTMLDialogElement | null;

export const openDARequestModal = () => dialog()?.showModal();
export const closeDARequestModal = () => dialog()?.close();

const MAX_PO_BYTES = 10 * 1024 * 1024;

export interface DARequestModalSubmitPayload {
  discountType: DiscountType;
  discountValue: number;
  justification: string;
  poFileName?: string;
}

interface DARequestModalProps {
  onSubmit: (payload: DARequestModalSubmitPayload) => void;
}

export default function DARequestModal({ onSubmit }: DARequestModalProps) {
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [valueInput, setValueInput] = useState('');
  const [justification, setJustification] = useState('');
  const [poFileName, setPoFileName] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);

  const reset = () => {
    setDiscountType('percentage');
    setValueInput('');
    setJustification('');
    setPoFileName(null);
    setValueError(null);
  };

  const cancel = () => {
    reset();
    closeDARequestModal();
  };

  const parseValue = (): number | null => {
    const cleaned = valueInput.replace(/[%$,\s]/g, '');
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (discountType === 'percentage' && n > 100) return null;
    return n;
  };

  const submit = () => {
    const discountValue = parseValue();
    if (discountValue == null) {
      setValueError(
        discountType === 'percentage'
          ? 'Enter a percentage between 0 and 100.'
          : 'Enter a valid flat dollar amount.'
      );
      return;
    }
    if (!justification.trim()) return;

    onSubmit({
      discountType,
      discountValue,
      justification: justification.trim(),
      poFileName: poFileName ?? undefined,
    });
    reset();
    closeDARequestModal();
  };

  const canSubmit = Boolean(valueInput.trim() && justification.trim());

  return (
    <ModusWcModal
      modalId={DA_REQUEST_MODAL_ID}
      customClass="da-request-modal modus-mobile-fullscreen-modal"
      backdrop="default"
      position="center"
      showClose
      aria-label="Request discretionary discount"
    >
      <div slot="header">
        <ModusWcTypography
          hierarchy="h2"
          size="lg"
          weight="semibold"
          label="Request Discretionary Discount (DA)"
        />
      </div>

      <div slot="content" className="flex min-w-0 flex-col gap-4">
        <ModusWcAlert
          variant="warning"
          icon="info"
          alertDescription="Your request will be sent to Trimble Sales Ops for approval. Reviews take up to 48 hours."
        />

        <fieldset className="da-discount-type-fieldset flex flex-col gap-2">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label="Discount request type"
          />
          <div
            className="da-discount-type-segmented"
            role="group"
            aria-label="Discount request type"
          >
            <ModusWcButton
              color={discountType === 'percentage' ? 'primary' : 'tertiary'}
              variant={discountType === 'percentage' ? 'filled' : 'outlined'}
              size="sm"
              customClass="da-discount-type-segment"
              aria-pressed={discountType === 'percentage'}
              onButtonClick={() => {
                setDiscountType('percentage');
                setValueError(null);
              }}
            >
              % Percentage
            </ModusWcButton>
            <ModusWcButton
              color={discountType === 'flat' ? 'primary' : 'tertiary'}
              variant={discountType === 'flat' ? 'filled' : 'outlined'}
              size="sm"
              customClass="da-discount-type-segment"
              aria-pressed={discountType === 'flat'}
              onButtonClick={() => {
                setDiscountType('flat');
                setValueError(null);
              }}
            >
              $ Fixed amount
            </ModusWcButton>
          </div>
          <div className="da-discount-type-radios flex flex-wrap gap-4">
            <ModusWcRadio
              name="da-discount-type"
              label="Percentage (%)"
              size="sm"
              value={discountType === 'percentage'}
              onInputChange={(e: CustomEvent) => {
                if (readInputChecked(e)) {
                  setDiscountType('percentage');
                  setValueError(null);
                }
              }}
            />
            <ModusWcRadio
              name="da-discount-type"
              label="Flat Amount ($)"
              size="sm"
              value={discountType === 'flat'}
              onInputChange={(e: CustomEvent) => {
                if (readInputChecked(e)) {
                  setDiscountType('flat');
                  setValueError(null);
                }
              }}
            />
          </div>
        </fieldset>

        <ModusWcTextInput
          label={
            discountType === 'percentage'
              ? 'Requested discount (%)'
              : 'Requested discount ($)'
          }
          placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 2500'}
          required
          value={valueInput}
          feedback={
            valueError ? { level: 'error', message: valueError } : undefined
          }
          onInputChange={(e: CustomEvent) => {
            setValueInput(readInputString(e));
            setValueError(null);
          }}
        />

        <ModusWcTextarea
          label="Justification / reasoning"
          placeholder='e.g. "Competitive bid against Leica for site expansion order."'
          required
          rows={4}
          value={justification}
          onInputChange={(e: CustomEvent) =>
            setJustification(readInputString(e))
          }
        />

        <div className="flex flex-col gap-2">
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            weight="semibold"
            label="Optional PO document"
          />
          <ModusWcTypography
            hierarchy="p"
            size="xs"
            customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
            label=".pdf or .png · Max 10MB"
          />
          <ModusWcFileDropzone
            acceptFileTypes=".pdf,.png"
            maxFileCount={1}
            maxTotalFileSizeBytes={MAX_PO_BYTES}
            instructions="Drag PO document here or browse to upload"
            invalidFileTypeMessage="Only .pdf and .png files are allowed."
            successMessage={poFileName ? `Attached: ${poFileName}` : undefined}
            onFileSelect={(e: CustomEvent<FileList>) => {
              setPoFileName(e.detail?.[0]?.name ?? null);
            }}
          />
        </div>
      </div>

      <div slot="footer" className="flex justify-end gap-2">
        <ModusWcButton
          variant="outlined"
          color="tertiary"
          size="sm"
          aria-label="Cancel discretionary discount request"
          onButtonClick={cancel}
        >
          Cancel
        </ModusWcButton>
        <ModusWcButton
          variant="filled"
          color="primary"
          size="sm"
          disabled={!canSubmit}
          aria-label="Submit discount request"
          onButtonClick={submit}
        >
          <ModusWcIcon name="check_circle" size="xs" decorative />
          Submit Discount Request
        </ModusWcButton>
      </div>
    </ModusWcModal>
  );
}
