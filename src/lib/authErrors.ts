/**
 * Safe, user-friendly authentication and email verification error handler.
 * Prevents exposing raw Supabase/PostgREST internals to normal users.
 */

/**
 * Normalizes an email address before authentication and storage:
 * 1. Strips leading and trailing single/double quotes or backticks (e.g. "user@domain.com" -> user@domain.com).
 * 2. Removes invisible zero-width unicode characters (\u200B, \u200C, \u200D, \uFEFF, \u00A0) and control characters.
 * 3. Unescapes backslash-escaped characters (e.g. \@ -> @).
 * 4. Removes any stray backslashes.
 * 5. Trims leading and trailing whitespace.
 * 6. Converts to lowercase for consistent Supabase Auth indexing and lookup.
 */
export function normalizeAuthEmail(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim();
  // Strip surrounding quotes
  clean = clean.replace(/^["'`]+|["'`]+$/g, '').trim();
  // Remove zero-width spaces, BOM, NBSP, and control characters
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(new RegExp('[\\u200B-\\u200D\\uFEFF\\u00A0\\x00-\\x1F\\x7F]', 'g'), '');
  // Unescape backslash-escaped characters (e.g. \@ -> @)
  clean = clean.replace(/\\@/g, '@');
  clean = clean.replace(/\\/g, '');
  clean = clean.trim();
  clean = clean.toLowerCase();
  return clean;
}

/**
 * Standard RFC 5322 compatible email validation pattern.
 * Validates standard user@domain.tld structure compatible with Supabase GoTrue Auth.
 */
export const EMAIL_VALIDATION_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidAuthEmail(email: string): boolean {
  const normalized = normalizeAuthEmail(email);
  if (!normalized) return false;
  if (!EMAIL_VALIDATION_REGEX.test(normalized)) return false;
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (!domain.includes('.')) return false;
  const domainParts = domain.split('.');
  if (domainParts.some(p => p.length === 0)) return false;
  if (domainParts[domainParts.length - 1].length < 2) return false;
  return true;
}

export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();
  return (
    lower.includes('rate limit') ||
    lower.includes('rate_limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('too many requests') ||
    lower.includes('60 seconds') ||
    error.status === 429
  );
}

export function isEmailNotConfirmedError(error: any): boolean {
  if (!error) return false;
  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();
  return lower.includes('email not confirmed') || lower.includes('email_not_confirmed');
}

export function isEmailAddressInvalidError(error: any): boolean {
  if (!error) return false;
  const code = (error.code || '').toLowerCase();
  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();
  return (
    code === 'email_address_invalid' ||
    (code === 'validation_failed' && lower.includes('email')) ||
    lower.includes('email_address_invalid') ||
    (lower.includes('email') && lower.includes('is invalid')) ||
    lower.includes('unable to validate email address')
  );
}

export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (isRateLimitError(error)) {
    return 'Verification email limit reached. Please wait a few minutes before requesting another email.';
  }

  if (isEmailNotConfirmedError(error)) {
    return 'Your email address is not yet verified. Please check your inbox or request a new verification link below.';
  }

  if (isEmailAddressInvalidError(error)) {
    return 'The email address format was rejected by the authentication system. Please check for special characters or register using your personal Gmail address.';
  }

  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Invalid credentials. Please verify your roll number / email and password.';
  }

  if (lower.includes('user already registered') || lower.includes('identity already exists')) {
    return 'This email or account is already registered. Please sign in to your account.';
  }

  if (lower.includes('password should be') || lower.includes('weak_password')) {
    return 'Password must be at least 6 characters long.';
  }

  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  // Sanitize away raw SDK/API prefix codes (e.g. "AuthApiError: ")
  const cleaned = message.replace(/^AuthApiError:\s*/i, '').trim();
  return cleaned || 'Authentication failed. Please try again.';
}

