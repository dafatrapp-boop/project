/**
 * Lightweight haptic feedback via the Vibration API.
 *
 * Platform reality, stated plainly rather than papered over: the
 * Vibration API is Android Chrome only — iOS Safari has never
 * implemented it (in a standalone PWA or otherwise) and there is no
 * web API substitute; only a native app using Apple's Core Haptics can
 * do this on iOS. Every call here is feature-detected and silently
 * no-ops where unsupported, so this is always safe to call
 * unconditionally from any interaction handler.
 */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if called outside a user gesture — never let
    // a cosmetic feature break the interaction it's attached to.
  }
}

export const HAPTIC_LIGHT = 8;
export const HAPTIC_MEDIUM = 18;
export const HAPTIC_SUCCESS = [10, 40, 10];
