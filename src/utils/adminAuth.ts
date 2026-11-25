/**
 * Role-Based Access Control (RBAC) configuration for Admin-only report actions
 * such as "Draft to Email". Standard viewers retain full dashboard visibility
 * and PDF / Excel exports without signing in.
 */
export const ADMIN_EMAIL = 'hharo@asia-affinity.com';

const ADMIN_SESSION_STORAGE_KEY = 'mancom_ar_verified_admin_email_v1';

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isAuthorizedAdminEmail(
  email: string | null | undefined,
  adminEmail: string = ADMIN_EMAIL
): boolean {
  const normalized = normalizeEmail(email);
  const configured = normalizeEmail(adminEmail);
  return Boolean(normalized && configured && normalized === configured);
}

export type AdminEmailValidationResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export function validateAdminLoginEmail(
  inputEmail: string,
  adminEmail: string = ADMIN_EMAIL
): AdminEmailValidationResult {
  const normalized = normalizeEmail(inputEmail);
  if (!normalized) {
    return {
      ok: false,
      error: 'Enter your authorized administrator email address.',
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return {
      ok: false,
      error: 'Enter a valid email address.',
    };
  }
  if (!isAuthorizedAdminEmail(normalized, adminEmail)) {
    return {
      ok: false,
      error: `Access denied for "${inputEmail.trim()}". Only the authorized admin account can unlock Draft to Email.`,
    };
  }
  return { ok: true, email: normalized };
}

export interface AdminSessionState {
  isAdmin: boolean;
  activeAdminEmail: string | null;
  source: 'google' | 'verified_email' | null;
}

export function resolveAdminSessionState(params: {
  googleUserEmail?: string | null;
  verifiedEmail?: string | null;
  adminEmail?: string;
}): AdminSessionState {
  const adminTarget = params.adminEmail ?? ADMIN_EMAIL;

  if (isAuthorizedAdminEmail(params.googleUserEmail, adminTarget)) {
    return {
      isAdmin: true,
      activeAdminEmail: normalizeEmail(params.googleUserEmail),
      source: 'google',
    };
  }

  if (isAuthorizedAdminEmail(params.verifiedEmail, adminTarget)) {
    return {
      isAdmin: true,
      activeAdminEmail: normalizeEmail(params.verifiedEmail),
      source: 'verified_email',
    };
  }

  return {
    isAdmin: false,
    activeAdminEmail: null,
    source: null,
  };
}

export function loadStoredAdminSession(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    return isAuthorizedAdminEmail(raw) ? normalizeEmail(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredAdminSession(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, normalizeEmail(email));
  } catch {
    // Ignore storage restriction
  }
}

export function clearStoredAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage restriction
  }
}
