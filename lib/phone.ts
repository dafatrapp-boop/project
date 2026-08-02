/**
 * Iraqi mobile phone validation, shared by client-side forms and their
 * server actions so both layers enforce exactly the same rule (see
 * CTO review item #4 — "رقم الهاتف في صفحات الهبوط").
 *
 * Accepted local formats (default country code is +964):
 *   07712345678   (11 digits, leading 0)
 *   7712345678    (10 digits, no leading 0)
 * Also accepts the same number with an explicit country code prefix
 * (+964 / 00964 / 964), since a visitor may paste a fully-qualified
 * number from their contacts app.
 *
 * Anything else — too short, too long, letters, symbols, or a prefix
 * other than 0/7 — is rejected with a specific reason so the UI can
 * show a precise message instead of one generic "invalid" error.
 */

export type PhoneValidationReason =
  | 'empty'
  | 'invalid_chars'
  | 'invalid_prefix'
  | 'too_short'
  | 'too_long';

export interface PhoneValidationResult {
  valid: boolean;
  /** E.164-ish normalized form, e.g. "+9647712345678". Only set when valid. */
  normalized?: string;
  reason?: PhoneValidationReason;
}

const REASON_MESSAGES: Record<PhoneValidationReason, string> = {
  empty: 'يرجى إدخال رقم الهاتف.',
  invalid_chars: 'رقم الهاتف يجب أن يتكون من أرقام فقط، بلا أحرف أو رموز.',
  invalid_prefix: 'رقم الهاتف يجب أن يبدأ بـ 07 أو 7 (رقم عراقي فقط، +964).',
  too_short: 'رقم الهاتف قصير جدًا — تأكد من إدخال الرقم كاملًا (مثال: 07712345678).',
  too_long: 'رقم الهاتف طويل جدًا — تأكد من عدم إضافة أرقام زائدة.',
};

export function phoneErrorMessage(reason: PhoneValidationReason): string {
  return REASON_MESSAGES[reason];
}

export function validateIraqiPhone(input: string): PhoneValidationResult {
  const trimmed = (input ?? '').trim();

  if (!trimmed) {
    return { valid: false, reason: 'empty' };
  }

  // Only digits, spaces, dashes, and a single leading + are acceptable
  // input shapes — anything else (letters, parentheses, other symbols)
  // is rejected up front rather than silently stripped.
  if (!/^\+?[\d\s-]+$/.test(trimmed)) {
    return { valid: false, reason: 'invalid_chars' };
  }

  let digits = trimmed.replace(/[\s-]/g, '');

  if (digits.startsWith('+964')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('00964')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('964') && digits.length > 10) {
    digits = digits.slice(3);
  } else if (digits.startsWith('+')) {
    // A "+" with any other country code is out of scope for this form.
    return { valid: false, reason: 'invalid_prefix' };
  }

  if (!/^\d+$/.test(digits)) {
    return { valid: false, reason: 'invalid_chars' };
  }

  // Normalize the optional leading trunk "0" (07... -> 7...).
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (!digits.startsWith('7')) {
    return { valid: false, reason: 'invalid_prefix' };
  }

  if (digits.length < 10) {
    return { valid: false, reason: 'too_short' };
  }
  if (digits.length > 10) {
    return { valid: false, reason: 'too_long' };
  }

  return { valid: true, normalized: `+964${digits}` };
}
