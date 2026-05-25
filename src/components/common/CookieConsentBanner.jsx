import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '../../context/CookieConsentContext';
import CookiePreferencesModal from './CookiePreferencesModal';

export default function CookieConsentBanner() {
  const { t } = useTranslation();
  const {
    bannerVisible,
    acceptAll,
    rejectNonEssential,
    openPreferences,
  } = useCookieConsent();

  return (
    <>
      {bannerVisible && (
        <div
          className="fixed inset-x-0 bottom-0 z-[10000] p-3 sm:p-4"
          role="region"
          aria-label={t('cookieConsentBannerLabel')}
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-2xl shadow-indigo-900/10 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Cookie className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 sm:text-base">
                  {t('cookieConsentBannerTitle')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {t('cookieConsentBannerBody')}{' '}
                  <Link
                    to="/privacy-policy#cookies"
                    className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
                  >
                    {t('Privacy Policy')}
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={rejectNonEssential}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t('cookieConsentReject')}
              </button>
              <button
                type="button"
                onClick={openPreferences}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
              >
                {t('cookieConsentManage')}
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                {t('cookieConsentAcceptAll')}
              </button>
            </div>
          </div>
        </div>
      )}
      <CookiePreferencesModal />
    </>
  );
}
