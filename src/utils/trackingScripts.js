const GA_SCRIPT_ID = 'cobrother-gtag-js';
const GA_INLINE_ID = 'cobrother-gtag-inline';
const META_SCRIPT_ID = 'cobrother-meta-pixel-js';
const META_INLINE_ID = 'cobrother-meta-pixel-inline';

function removeElementById(id) {
  document.getElementById(id)?.remove();
}

function injectScript({ id, src, inline }) {
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  if (src) {
    script.async = true;
    script.src = src;
  }
  if (inline) {
    script.textContent = inline;
  }
  document.head.appendChild(script);
}

export function getTrackingConfig() {
  return {
    gaId: import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || '',
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID?.trim() || '',
  };
}

export function loadGoogleAnalytics(measurementId) {
  if (!measurementId || typeof document === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  injectScript({
    id: GA_SCRIPT_ID,
    src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
  });

  injectScript({
    id: GA_INLINE_ID,
    inline: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', { anonymize_ip: true });
    `,
  });
}

export function unloadGoogleAnalytics() {
  removeElementById(GA_SCRIPT_ID);
  removeElementById(GA_INLINE_ID);
  if (typeof window !== 'undefined') {
    delete window.gtag;
    delete window.dataLayer;
  }
}

export function loadMetaPixel(pixelId) {
  if (!pixelId || typeof document === 'undefined') return;

  if (!window.fbq) {
    const n = (window.fbq = function fbq() {
      if (n.callMethod) {
        n.callMethod.apply(n, arguments);
      } else {
        n.queue.push(arguments);
      }
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
  }

  injectScript({
    id: META_SCRIPT_ID,
    src: 'https://connect.facebook.net/en_US/fbevents.js',
  });

  injectScript({
    id: META_INLINE_ID,
    inline: `
      if (typeof fbq === 'function') {
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      }
    `,
  });
}

export function unloadMetaPixel() {
  removeElementById(META_SCRIPT_ID);
  removeElementById(META_INLINE_ID);
  if (typeof window !== 'undefined') {
    delete window.fbq;
    delete window._fbq;
  }
}

export function applyTrackingConsent(preferences) {
  const { gaId, metaPixelId } = getTrackingConfig();

  if (preferences.analytics && gaId) {
    loadGoogleAnalytics(gaId);
  } else {
    unloadGoogleAnalytics();
  }

  if (preferences.marketing && metaPixelId) {
    loadMetaPixel(metaPixelId);
  } else {
    unloadMetaPixel();
  }
}
