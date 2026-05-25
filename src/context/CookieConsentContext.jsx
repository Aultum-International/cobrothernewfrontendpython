import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredConsent,
  hasStoredConsent,
  saveConsent,
} from '../lib/cookieConsentStorage';
import { applyTrackingConsent } from '../utils/trackingScripts';

const CookieConsentContext = createContext(null);

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

export function CookieConsentProvider({ children }) {
  const [preferences, setPreferences] = useState(() => getStoredConsent());
  const [bannerVisible, setBannerVisible] = useState(() => !hasStoredConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const persistAndApply = useCallback((next) => {
    const saved = saveConsent(next);
    setPreferences(saved);
    setBannerVisible(false);
    applyTrackingConsent(saved);
    return saved;
  }, []);

  useEffect(() => {
    if (preferences?.decidedAt) {
      applyTrackingConsent(preferences);
    }
  }, []);

  const acceptAll = useCallback(() => {
    persistAndApply({ analytics: true, marketing: true });
    setPreferencesOpen(false);
  }, [persistAndApply]);

  const rejectNonEssential = useCallback(() => {
    persistAndApply({ analytics: false, marketing: false });
    setPreferencesOpen(false);
  }, [persistAndApply]);

  const savePreferences = useCallback(
    (draft) => {
      persistAndApply({
        analytics: Boolean(draft.analytics),
        marketing: Boolean(draft.marketing),
      });
      setPreferencesOpen(false);
    },
    [persistAndApply],
  );

  const openPreferences = useCallback(() => {
    setPreferencesOpen(true);
    setBannerVisible(false);
  }, []);

  const closePreferences = useCallback(() => {
    setPreferencesOpen(false);
    if (!hasStoredConsent()) {
      setBannerVisible(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      hasDecided: Boolean(preferences?.decidedAt),
      bannerVisible,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [
      preferences,
      bannerVisible,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
      closePreferences,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}
