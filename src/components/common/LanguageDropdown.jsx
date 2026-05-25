import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

const LANGUAGES = [
  { code: 'en', name: 'English (IND)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'ur', name: 'Urdu' },
  { code: 'zh', name: '中文' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
];

function languageLabel(i18nLanguage) {
  const exact = LANGUAGES.find((l) => l.code === i18nLanguage);
  if (exact) return exact.name;
  const base = (i18nLanguage || '').split('-')[0];
  return LANGUAGES.find((l) => l.code === base)?.name || 'English (IND)';
}

export default function LanguageDropdown({ variant = 'dark', className = '' }) {
  const { i18n } = useTranslation();
  const { changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const isDark = variant === 'dark';
  const triggerCls = isDark
    ? 'text-white text-xs md:text-sm font-normal no-underline flex items-center gap-1 px-2 sm:px-2.5 md:px-3 py-1.5 rounded transition-colors duration-200 cursor-pointer bg-transparent border-none font-body hover:bg-white/15 hover:text-gray-200 max-w-[min(100%,11rem)]'
    : 'inline-flex max-w-[min(100%,11rem)] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300/90 bg-white px-3 py-1.5 text-xs font-medium tracking-wide text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-200/80';

  const panelCls =
    'absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] overflow-hidden z-[1002]';

  const isNavUtil = className.includes('home-nav-util-language');

  return (
    <div className={`relative shrink-0 ${className}`.trim()} ref={ref}>
      <button
        type="button"
        className={`${triggerCls}${isNavUtil ? ' home-nav-util-btn' : ''}`.trim()}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe size={13} className="shrink-0 text-slate-500 md:h-3.5 md:w-3.5" strokeWidth={2} />
        <span className="home-nav-language-label truncate">{languageLabel(i18n.language)}</span>
        <ChevronDown size={13} className="shrink-0 text-slate-500" strokeWidth={2} />
      </button>
      {open && (
        <div className={panelCls} role="listbox">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`w-full px-4 py-2.5 bg-transparent border-none text-left text-sm cursor-pointer transition-colors duration-200 font-body ${
                i18n.language === lang.code
                  ? 'bg-purple-50 text-purple font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => {
                changeLanguage(lang.code);
                setOpen(false);
              }}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
