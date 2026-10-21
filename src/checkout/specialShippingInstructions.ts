/** Checkout hold state when dealers add non-standard shipping notes. */
export type OrderHoldStatus = 'NONE' | 'MANUAL_SHIPPING_HOLD';

export const SPECIAL_SHIPPING_NOTES_MAX_LENGTH = 500;

export interface SpecialShippingInstructionsState {
  /** Opt-in: dealer wants to provide special instructions. */
  isSpecialShippingSelected: boolean;
  /**
   * Hold acknowledgment. In the current UI this mirrors opt-in once the
   * manual-review warning is shown (no separate agreement checkbox).
   */
  hasAgreedToHold: boolean;
  /** Special delivery / freight notes (max 500). */
  instructionsText: string;
  /** True when the dealer opted in with non-empty notes. */
  hasSpecialInstructions: boolean;
  /** Manual Trimble Orders hold while special instructions are requested. */
  orderHoldStatus: OrderHoldStatus;
}

export const INITIAL_SPECIAL_SHIPPING_STATE: SpecialShippingInstructionsState = {
  isSpecialShippingSelected: false,
  hasAgreedToHold: false,
  instructionsText: '',
  hasSpecialInstructions: false,
  orderHoldStatus: 'NONE',
};
