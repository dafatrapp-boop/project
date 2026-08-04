'use client';

import { useEffect, useId, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; 'error-callback'?: () => void }
      ) => string;
    };
  }
}

/**
 * Cloudflare Turnstile — architecture review 7.2 ("bot protection is
 * only honeypot + rate limit, no real CAPTCHA"). Turnstile is free
 * with no request cap for this kind of usage, so it's the direct
 * open-source-equivalent-cost alternative to a paid captcha service:
 * only requires the platform operator's own free Cloudflare site key
 * (NEXT_PUBLIC_TURNSTILE_SITE_KEY), not a per-workspace merchant
 * account. Renders nothing if the env var isn't set, so the form keeps
 * working exactly as before (honeypot + rate limit only) until it's
 * configured.
 */
export function TurnstileWidget({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const containerId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    function tryRender() {
      if (renderedRef.current || !window.turnstile || !containerRef.current) return;
      renderedRef.current = true;
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        'error-callback': () => onToken(''),
      });
    }
    tryRender();
    const interval = setInterval(tryRender, 300);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div id={containerId} ref={containerRef} />
    </>
  );
}
