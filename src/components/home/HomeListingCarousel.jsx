import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { publicAPI } from '../../api/services';
import useCurrency from '../../context/CurrencyContext';
import { filterFeaturedGuestListings, isGuestCreatedListing } from '../../utils/homepageListings';
import { isPremiumDomain } from '../../utils/domainPricing';
import { asArray } from '../../utils/asArray';
import { getGoogleOAuthLoginUrl } from '../../config/urls';

import 'swiper/css';
import 'swiper/css/navigation';

const TYPE_LABELS = {
  STARTUP: 'Startup',
  BUSINESS: 'Business',
  PROJECT: 'Project',
  IDEA: 'Idea',
};

const STATUS_STYLES = {
  AVAILABLE: { color: '#6ec896', bg: 'rgba(110,200,150,0.1)', border: 'rgba(110,200,150,0.3)' },
  PENDING: { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', border: 'rgba(200,169,110,0.3)' },
  SOLD: { color: '#c86e6e', bg: 'rgba(200,110,110,0.1)', border: 'rgba(200,110,110,0.3)' },
};

function mapVentureToSlide(venture) {
  const b = venture.brandDetails || {};
  const desc = (b.description || '').trim();
  const shortDesc = desc.length > 130 ? `${desc.slice(0, 130)}…` : desc;
  return {
    key: `venture-${venture.id}`,
    kind: 'venture',
    id: venture.id,
    title: b.brandName || 'Venture',
    description: shortDesc || 'Co-venture opportunity on CoBrother.',
    imageUrl: b.ventureImageUrl,
    initials: (b.brandName || '?').slice(0, 1).toUpperCase(),
    path: `/ventures/${venture.id}`,
    priceLabel: b.dealValue,
    badges: [
      b.industry && { text: String(b.industry).replace(/_/g, ' '), className: 'bg-indigo-50 text-indigo-600' },
      b.ventureType && {
        text: TYPE_LABELS[b.ventureType] || b.ventureType,
        className: 'bg-purple-50 text-purple-600',
      },
    ].filter(Boolean),
  };
}

function mapDomainToSlide(domain) {
  const initials = (domain.domainName || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase() || '?';
  const bits = [domain.pricingDemand, domain.domainExtension].filter(Boolean);
  return {
    key: `domain-${domain.id}`,
    kind: 'domain',
    id: domain.id,
    title: `${domain.domainName || ''}${domain.domainExtension || ''}`,
    description: bits.join(' · ') || 'Premium domain listing.',
    imageUrl: domain.logo,
    initials,
    path: `/domains/${domain.id}`,
    priceLabel: domain.askingPrice,
    badges: [
      domain.domainStatus && { text: domain.domainStatus, className: 'bg-green-50 text-green-600 border border-green-200' },
      isPremiumDomain(domain) && { text: 'Premium', className: 'bg-purple-50 text-purple-600 border border-purple-200' },
    ].filter(Boolean),
  };
}

function mapSoftwareToSlide(item) {
  const st = STATUS_STYLES[item.softwareStatus] || STATUS_STYLES.AVAILABLE;
  return {
    key: `software-${item.id}`,
    kind: 'software',
    id: item.id,
    title: item.name || 'Software',
    description: (item.description || '').trim() || 'Technology listing on CoBrother.',
    imageUrl: item.imageUrl,
    initials: '⧁',
    path: `/cocreation/${item.id}`,
    priceLabel: item.price,
    badges: [
      item.category && {
        text: String(item.category).replace(/_/g, ' '),
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
      },
      {
        text: item.softwareStatus || 'AVAILABLE',
        style: { color: st.color, background: st.bg, border: `1px solid ${st.border}` },
      },
    ].filter(Boolean),
  };
}

/** Same sources as VenturesSection, DomainsSection, and TechnologySection (homepage featured rows). */
function buildDeck(ventures, domains, softwares) {
  const vs = filterFeaturedGuestListings(ventures, 'venture');
  const ds = asArray(domains).filter((d) => isGuestCreatedListing(d, 'domain') && isPremiumDomain(d));
  const ss = filterFeaturedGuestListings(softwares, 'software');

  const maxEach = 8;
  const vSlice = vs.slice(0, maxEach);
  const dSlice = ds.slice(0, maxEach);
  const sSlice = ss.slice(0, maxEach);

  const merged = [];
  const mx = Math.max(vSlice.length, dSlice.length, sSlice.length);
  for (let i = 0; i < mx; i++) {
    if (vSlice[i]) merged.push(mapVentureToSlide(vSlice[i]));
    if (dSlice[i]) merged.push(mapDomainToSlide(dSlice[i]));
    if (sSlice[i]) merged.push(mapSoftwareToSlide(sSlice[i]));
  }
  return merged.slice(0, 24);
}

function ensureLoopMin(slides, min) {
  if (slides.length >= min || slides.length === 0) return slides;
  const out = [...slides];
  let i = 0;
  while (out.length < min) {
    const base = slides[i % slides.length];
    out.push({ ...base, key: `${base.key}__loop-${out.length}` });
    i += 1;
  }
  return out;
}

export default function HomeListingCarousel() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const prevNavRef = useRef(null);
  const nextNavRef = useRef(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [vr, dr, sr] = await Promise.all([
          publicAPI.getVentures(),
          publicAPI.getDomains(),
          publicAPI.getSoftwares(),
        ]);
        if (cancelled) return;
        const deck = buildDeck(asArray(vr.data), asArray(dr.data), asArray(sr.data));
        setSlides(deck);
      } catch (e) {
        console.error('HomeListingCarousel fetch failed', e);
        if (!cancelled) setSlides([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loopSlides = useMemo(() => ensureLoopMin(slides, 6), [slides]);
  const enableLoop = loopSlides.length >= 3;

  const goAuthThen = (path) => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirectAfterLogin', path);
      window.location.href = getGoogleOAuthLoginUrl();
    } else {
      window.location.href = path;
    }
  };

  const handleExplore = (slide, e) => {
    e?.stopPropagation();
    goAuthThen(slide.path);
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-slate-50 to-white border-y border-gray-100">
        <div className="w-full flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-slate-50 to-white border-y border-gray-100 overflow-hidden">
      <div className="w-full">
        <div className="home-listing-carousel-header mb-8 md:mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t('homeCarouselTitle')}
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl">
            {t('homeCarouselSubtitle')}
          </p>
        </div>

        <div className="cb-home-listing-swiper relative px-10 sm:px-12 md:px-14">
          <button
            type="button"
            ref={prevNavRef}
            className="cb-home-carousel-prev absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            aria-label={t('homeCarouselPrev')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            ref={nextNavRef}
            className="cb-home-carousel-next absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            aria-label={t('homeCarouselNext')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <style>{`
            .cb-home-listing-swiper .swiper-slide {
              height: auto;
              transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease, filter 0.45s ease;
              opacity: 0.55;
              transform: scale(0.9);
              filter: grayscale(0.15);
            }
            .cb-home-listing-swiper .swiper-slide-prev,
            .cb-home-listing-swiper .swiper-slide-next {
              opacity: 0.72;
              transform: scale(0.95);
              filter: grayscale(0.08);
            }
            .cb-home-listing-swiper .swiper-slide-active {
              opacity: 1;
              transform: scale(1.04);
              filter: none;
              z-index: 2;
            }
          `}</style>

          <Swiper
            className="!pb-2"
            modules={[Autoplay, Navigation]}
            centeredSlides
            loop={enableLoop}
            loopAdditionalSlides={2}
            watchOverflow
            speed={600}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              prevEl: prevNavRef.current,
              nextEl: nextNavRef.current,
            }}
            onBeforeInit={(swiper) => {
              if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                swiper.params.navigation.prevEl = prevNavRef.current;
                swiper.params.navigation.nextEl = nextNavRef.current;
              }
            }}
            onSwiper={(swiper) => {
              swiper.navigation?.init();
              swiper.navigation?.update();
            }}
          >
            {loopSlides.map((slide) => (
              <SwiperSlide key={slide.key}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goAuthThen(slide.path)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goAuthThen(slide.path);
                    }
                  }}
                  className="card-glow-hover h-full p-4 md:p-5 bg-white border border-gray-200 rounded-[14px] flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {slide.imageUrl ? (
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[10px] bg-indigo-50 border border-indigo-200 flex items-center justify-center font-display text-lg font-bold text-indigo-600 flex-shrink-0">
                        {slide.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
                      {slide.badges?.map((b, i) =>
                        b.style ? (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-xs font-semibold"
                            style={b.style}
                          >
                            {b.text}
                          </span>
                        ) : (
                          <span key={i} className={`px-2 py-0.5 rounded-md text-xs font-semibold ${b.className}`}>
                            {b.text}
                          </span>
                        ),
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600">
                        {slide.kind === 'venture' && t('homeCarouselBadgeVenture')}
                        {slide.kind === 'domain' && t('homeCarouselBadgeDomain')}
                        {slide.kind === 'software' && t('homeCarouselBadgeTech')}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-gray-900 mb-2 line-clamp-2">{slide.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 flex-1 mb-3">{slide.description}</p>

                  {slide.priceLabel != null && slide.priceLabel !== '' && (
                    <div className="font-display text-lg font-bold text-green-600 mb-3">
                      {formatPrice(slide.priceLabel)}
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-3 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => handleExplore(slide, e)}
                      className="btn-glow btn-glow-sm w-full"
                    >
                      {t('exploreBtn')} →
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
