export type OrderAccessSource = 'qr' | 'nfc' | 'direct';

/** Resolve how the customer opened the menu for order/table-call payloads. */
export function resolveOrderAccessSource(storeValue: OrderAccessSource | null | undefined): OrderAccessSource {
  if (storeValue === 'qr' || storeValue === 'nfc') return storeValue;
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('source');
    if (q === 'qr' || q === 'nfc') return q;
  }
  return 'direct';
}
