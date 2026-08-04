/**
 * Fire-and-forget client-side error report to /api/log-error (migration
 * 0038). Never throws — a failure to report an error must never itself
 * become a second error.
 */
export function reportClientError(error: Error & { digest?: string }) {
  try {
    void fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.digest ? `${error.message} (digest: ${error.digest})` : error.message,
        stack: error.stack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
      keepalive: true,
    });
  } catch {
    // Swallow — reporting failures must never surface to the user.
  }
}
