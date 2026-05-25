import en from '../locales/en.json';
import enGB from '../locales/en-GB.json';
import enUS from '../locales/en-US.json';
import hi from '../locales/hi.json';
import zh from '../locales/zh.json';
import ur from '../locales/ur.json';
import fr from '../locales/fr.json';
import pt from '../locales/pt.json';
import de from '../locales/de.json';

/** Merge English keys so partial locale files still translate the full UI. */
function withEnglishFallback(locale) {
  return { ...en, ...locale };
}

export function buildI18nResources() {
  return {
    en: { translation: en },
    'en-GB': { translation: withEnglishFallback(enGB) },
    'en-US': { translation: withEnglishFallback(enUS) },
    hi: { translation: withEnglishFallback(hi) },
    zh: { translation: withEnglishFallback(zh) },
    ur: { translation: withEnglishFallback(ur) },
    fr: { translation: withEnglishFallback(fr) },
    pt: { translation: withEnglishFallback(pt) },
    de: { translation: withEnglishFallback(de) },
  };
}

export const supportedLanguages = ['en', 'en-GB', 'en-US', 'hi', 'zh', 'ur', 'fr', 'pt', 'de'];
