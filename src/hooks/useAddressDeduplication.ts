import { useEffect, useState } from 'react';
import type { Address } from '../checkout/checkoutData';

const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

export function findDuplicateAddress(
  street: string,
  postalCode: string,
  savedAddresses: Address[],
  excludeId?: string | null
): Address | null {
  const streetKey = normalize(street);
  const zipKey = normalize(postalCode);
  if (!streetKey || !zipKey) return null;

  return (
    savedAddresses.find(
      (item) =>
        item.id !== excludeId &&
        normalize(item.street) === streetKey &&
        normalize(item.postalCode) === zipKey
    ) ?? null
  );
}

/**
 * Background duplicate check against other saved account addresses
 * while the user edits street + ZIP (excludes the address being edited).
 */
export function useAddressDeduplication(
  street: string,
  postalCode: string,
  savedAddresses: Address[],
  excludeId?: string | null,
  debounceMs = 300
): Address | null {
  const [matchedAddress, setMatchedAddress] = useState<Address | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMatchedAddress(
        findDuplicateAddress(street, postalCode, savedAddresses, excludeId)
      );
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [street, postalCode, savedAddresses, excludeId, debounceMs]);

  return matchedAddress;
}
