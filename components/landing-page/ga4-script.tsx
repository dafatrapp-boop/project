import Script from 'next/script';

/**
 * Google Analytics 4 base tag for one workspace's landing page (gaps-
 * checklist review 4.2). Only mounted when the workspace has entered
 * its own GA4 Measurement ID in Settings — same "merchant-owned, never
 * generated or inferred" rule as the Meta Pixel integration.
 */
export function Ga4Script({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
