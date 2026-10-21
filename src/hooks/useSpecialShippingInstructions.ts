import { useState } from 'react';
import {
  INITIAL_SPECIAL_SHIPPING_STATE,
  type SpecialShippingInstructionsState,
} from '../checkout/specialShippingInstructions';

export interface UseSpecialShippingInstructionsResult {
  state: SpecialShippingInstructionsState;
  setState: (state: SpecialShippingInstructionsState) => void;
  reset: () => void;
}

/**
 * Checkout mirror of SpecialShippingInstructionsCard progressive disclosure.
 * The card owns UI state; this store receives synced snapshots for place-order.
 */
export function useSpecialShippingInstructions(): UseSpecialShippingInstructionsResult {
  const [state, setState] = useState<SpecialShippingInstructionsState>(
    INITIAL_SPECIAL_SHIPPING_STATE
  );

  const reset = () => setState(INITIAL_SPECIAL_SHIPPING_STATE);

  return { state, setState, reset };
}
