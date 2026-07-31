declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a Meta Pixel standard event if the base script has loaded.
 * Safe to call unconditionally — becomes a no-op when the workspace
 * has no Pixel ID configured (fbq is never injected in that case).
 */
export function trackPixelEvent(event: 'Lead' | 'Contact', params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', event, params);
  }
}
