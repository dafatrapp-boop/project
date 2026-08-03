'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextValue {
  /** True once the browser has fired `beforeinstallprompt` (Chrome/Edge/Android). */
  canInstall: boolean;
  /** True once the app is running in standalone/installed mode. */
  isInstalled: boolean;
  /** iOS Safari never fires beforeinstallprompt — this flags the "show manual instructions" path. */
  isIOSInstallable: boolean;
  /** Triggers the native install prompt. Resolves to the user's choice, or null if unavailable. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export function usePWA() {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error('usePWA must be used within a PWAProvider');
  return ctx;
}

/**
 * Mounted once near the root (see app/layout.tsx). Owns:
 *  1. Service worker registration + the "update available" banner.
 *  2. Capturing `beforeinstallprompt` so install UI elsewhere in the
 *     app (header button, More-page row) can trigger it on demand —
 *     the event can only be used once and only if we hold onto it.
 *  3. Standalone-mode / iOS detection, exposed via usePWA().
 *
 * Deliberately renders no visible install UI itself — placement is a
 * design decision made per-surface (header, More page), not here.
 */
export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSInstallable, setIsIOSInstallable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari-specific flag — not in the standard lib.dom typings.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIOS && !standalone) setIsIOSInstallable(true);

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (cancelled) return;

        // A worker may already be waiting from a previous session.
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installing);
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => console.warn('[pwa] service worker registration failed', err));

    let refreshing = false;
    function onControllerChange() {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    setReloading(true);
    waitingWorker.postMessage('SKIP_WAITING');
  }, [waitingWorker]);

  return (
    <PWAContext.Provider
      value={{
        canInstall: Boolean(deferredPrompt) && !isInstalled,
        isInstalled,
        isIOSInstallable,
        promptInstall,
      }}
    >
      {children}
      {updateAvailable && (
        <div
          role="status"
          className={cn(
            'fixed bottom-20 start-4 z-50 flex max-w-xs items-center gap-3 rounded-lg border border-border bg-surface-overlay px-4 py-3.5 shadow-overlay',
            'animate-rise-in md:bottom-4'
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <RotateCw size={15} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-ink">تحديث جديد متاح</p>
            <p className="text-caption text-ink-muted">أعد التحميل لتفعيل آخر نسخة.</p>
          </div>
          <button
            onClick={applyUpdate}
            disabled={reloading}
            className="shrink-0 rounded-md bg-brand-500 px-3 py-1.5 text-body-sm font-medium text-ink-onbrand transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {reloading ? '...' : 'تحديث'}
          </button>
        </div>
      )}
    </PWAContext.Provider>
  );
}
