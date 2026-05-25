import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useCurrency from '../../context/CurrencyContext';
import { publicAPI } from '../../api/services';
import { filterFeaturedGuestListings } from '../../utils/homepageListings';
import { getGoogleOAuthLoginUrl } from '../../config/urls';

const TYPE_LABELS = {
  STARTUP: 'Startup',
  BUSINESS: 'Business',
  PROJECT: 'Project',
  IDEA: 'Idea',
};

export default function VenturesSection() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [ventures, setVentures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVentures = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getVentures();
        setVentures(response.data || []);
      } catch (error) {
        console.error('Failed to fetch ventures:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVentures();
  }, []);

  const featuredVentures = useMemo(
    () => filterFeaturedGuestListings(ventures, 'venture'),
    [ventures],
  );

  const handleCardClick = (ventureId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirectAfterLogin', `/ventures/${ventureId}`);
      window.location.href = getGoogleOAuthLoginUrl();
    } else {
      window.location.href = `/ventures/${ventureId}`;
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('coVentures')}
          </h3>
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (featuredVentures.length === 0) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('coVentures')}
          </h3>
          <p className="text-center text-gray-500 py-12">{t('noVentures')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-4 md:py-6 ">
      <div className="w-full">
        <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
          {t('coVentures')}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {featuredVentures.slice(0, 8).map((venture) => {
            const b = venture.brandDetails || {};
            const shortDesc = `${b.description?.slice(0, 130) || ''}${b.description?.length > 130 ? '…' : ''}`;

            return (
              <div
                key={venture.id}
                className="card-glow-hover p-4 md:p-5 bg-white border border-gray-200 rounded-[14px] cursor-pointer flex flex-col transition-all duration-300"
                onClick={() => handleCardClick(venture.id)}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    {b.ventureImageUrl ? (
                      <img 
                        src={b.ventureImageUrl} 
                        alt={b.brandName} 
                        className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[10px] bg-indigo-50 border border-indigo-200 flex items-center justify-center font-display text-xl font-bold text-indigo-600 flex-shrink-0">
                        {b.brandName?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded">
                          {b.industry?.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded">
                          {TYPE_LABELS[b.ventureType] || b.ventureType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
                    {b.brandName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-1">
                    {shortDesc}
                  </p>

                  {b.dealValue && (
                    <div className="text-lg font-bold text-green-600 mb-3">
                      {formatPrice(b.dealValue)}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3 mb-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span title="Views" className="flex items-center gap-1">
                      👁 {venture.views || 0}
                    </span>
                    <span title="Applications" className="flex items-center gap-1">
                      📋 {venture.coVentureApplicationCount || 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button className="btn-glow btn-glow-sm flex-1">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
