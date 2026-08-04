/**
 * Transactional email via Resend's HTTP API (architecture/gaps review
 * 4.4 — "no real email provider configured"). Resend's free tier
 * (3,000 emails/month, no credit card) is more than enough for a
 * workspace's team invites and notification emails, so this is a
 * genuinely free alternative rather than a paid dependency — the only
 * "cost" is the workspace operator creating their own free account and
 * setting RESEND_API_KEY. No SDK dependency: Resend's API is a single
 * plain POST, so this avoids adding a package for one call.
 *
 * Same degrade-cleanly pattern as Stripe/Turnstile elsewhere in this
 * project: every call site checks the boolean return value and keeps
 * working (falling back to the existing link-only flow) when the
 * provider isn't configured, instead of throwing.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error('[email] Resend API error:', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] send failed:', error);
    return false;
  }
}
