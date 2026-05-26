/**
 * API / backend origin resolution.
 *
 * Local dev: set VITE_API_URL in .env.local (defaults to Render backend below).
 * Production / Vercel: set VITE_API_URL=https://cobrotherpythonbackend-1.onrender.com
 */
export const PRODUCTION_API_ORIGIN = 'https://cobrotherpythonbackend-1.onrender.com';
export const PRODUCTION_APP_URL = 'https://cobrother.com';

const LOCAL_API_ORIGIN = 'http://127.0.0.1:8000';

const remoteApiBase =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

const isDev = import.meta.env.DEV;

/** Backend origin for OAuth redirects and WebSockets. */
export const API_ORIGIN =
  remoteApiBase || (isDev ? LOCAL_API_ORIGIN : PRODUCTION_API_ORIGIN);

/** Axios baseURL — direct to backend when VITE_API_URL is set. */
export const API_BASE_URL =
  remoteApiBase || (isDev ? LOCAL_API_ORIGIN : PRODUCTION_API_ORIGIN);

export const APP_BASE_URL =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined'
    ? window.location.origin
    : PRODUCTION_APP_URL);

/** Always start Google OAuth on the API host (never via Vite proxy). */
export function getGoogleOAuthLoginUrl() {
  return `${API_ORIGIN.replace(/\/$/, '')}/oauth2/authorization/google`;
}

/**
 * In dev, localhost and 127.0.0.1 are different cookie hosts — normalize to 127.0.0.1.
 */
export function normalizeLocalDevOrigin() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  if (window.location.hostname === 'localhost') {
    const url = new URL(window.location.href);
    url.hostname = '127.0.0.1';
    window.location.replace(url.toString());
  }
}

const OAUTH_ERROR_MESSAGES = {
  invalid_oauth_state:
    'Google sign-in session expired or cookies were blocked. Use http://127.0.0.1:5173 (not localhost), then try again.',
  google_oauth_not_configured: 'Google sign-in is not configured on the server.',
  google_oauth_secret_missing: 'Google sign-in is not configured on the server.',
  oauth_token_exchange_failed:
    'Google could not verify the login (token exchange failed). In Google Cloud Console, set redirect URI to http://127.0.0.1:8000/api/v1/auth/oauth/google/callback and check GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in backend .env.',
  google_id_token_invalid:
    'Google returned an invalid sign-in token. Check GOOGLE_CLIENT_ID matches your OAuth client.',
  oauth_clock_skew:
    'Your PC clock is slightly out of sync with Google. Enable automatic date/time in Windows settings, then try again.',
  google_authentication_failed:
    'Google sign-in failed after authorization. Check the backend terminal logs, database is running, and try again.',
  oauth_failed: 'Google sign-in failed. Please try again.',
};

export function getOAuthLoginErrorMessage(errorCode) {
  if (!errorCode) return null;
  return OAUTH_ERROR_MESSAGES[errorCode] || `Sign-in error: ${errorCode}`;
}
