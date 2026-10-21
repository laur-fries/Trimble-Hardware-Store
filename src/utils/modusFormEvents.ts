type WithValue = { value?: string | null; checked?: boolean | null };

/** Read a string value from a Modus `inputChange` event (text/select/number/textarea). */
export function readInputString(e: CustomEvent): string {
  const t = (e.detail as InputEvent | undefined)?.target as WithValue | null;
  return t?.value ?? '';
}

/** Read a boolean from a Modus `inputChange` event (checkbox/switch/radio). */
export function readInputChecked(e: CustomEvent): boolean {
  const t = (e.detail as InputEvent | undefined)?.target as WithValue | null;
  return Boolean(t?.checked);
}
