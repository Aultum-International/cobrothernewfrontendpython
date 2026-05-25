export const CONSENT_COOKIE_NAME = 'cobrother_cookie_consent';
export const CONSENT_STORAGE_KEY = 'cobrother_cookie_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 365;

const defaultPreferences = () => ({
  version: CONSENT_VERSION,
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
});

export function parseConsent(raw) {
  if (!raw) return null;
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') return null;
    return {
      version: data.version ?? CONSENT_VERSION,
      essential: true,
      analytics: Boolean(data.analytics),
      marketing: Boolean(data.marketing),
      decidedAt: data.decidedAt ?? null,
    };
  } catch {
    return null;
  }
}

function readCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(CONSENT_COOKIE_NAME.length + 1));
}

export function getStoredConsent() {
  if (typeof window === 'undefined') return null;

  const fromCookie = parseConsent(readCookie());
  if (fromCookie?.decidedAt) return fromCookie;

  const fromStorage = parseConsent(localStorage.getItem(CONSENT_STORAGE_KEY));
  if (fromStorage?.decidedAt) return fromStorage;

  return null;
}

export function hasStoredConsent() {
  return Boolean(getStoredConsent()?.decidedAt);
}

export function saveConsent(preferences) {
  const payload = {
    ...defaultPreferences(),
    ...preferences,
    essential: true,
    decidedAt: new Date().toISOString(),
  };

  const serialized = JSON.stringify(payload);

  if (typeof document !== 'undefined') {
    const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(serialized)};path=/;max-age=${maxAge};SameSite=Lax`;
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  }

  return payload;
}

export function clearStoredConsent() {
  if (typeof document !== 'undefined') {
    document.cookie = `${CONSENT_COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  }
}
