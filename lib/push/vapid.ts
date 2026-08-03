/**
 * The Push API's `applicationServerKey` must be a Uint8Array, but
 * VAPID public keys are distributed/stored as a URL-safe base64
 * string (see NEXT_PUBLIC_VAPID_PUBLIC_KEY). This is the standard
 * conversion — no dependency needed for it.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}
