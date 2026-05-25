import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useCurrency from '../../context/CurrencyContext';
import { publicAPI } from '../../api/services';
import { useNavigate } from 'react-router-dom';
import { filterFeaturedGuestListings } from '../../utils/homepageListings';
import { getGoogleOAuthLoginUrl } from '../../config/urls';

const STATUS_COLORS = {
  AVAILABLE: { color: '#6ec896', bg: 'rgba(110,200,150,0.1)', border: 'rgba(110,200,150,0.3)' },
  PENDING:   { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', border: 'rgba(200,169,110,0.3)' },
  SOLD:      { color: '#c86e6e', bg: 'rgba(200,110,110,0.1)', border: 'rgba(200,110,110,0.3)' },
};

export default function TechnologySection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [softwares, setSoftwares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSoftwares = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getSoftwares();
        setSoftwares(response.data || []);
      } catch (error) {
        console.error('Failed to fetch software:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSoftwares();
  }, []);

  const featuredSoftwares = useMemo(
    () => filterFeaturedGuestListings(softwares, 'software'),
    [softwares],
  );

  const handleCardClick = (softwareId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirectAfterLogin', `/cocreation/${softwareId}`);
      window.location.href = getGoogleOAuthLoginUrl();
    } else {
      window.location.href = `/cocreation/${softwareId}`;
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('technologySoftware')}
          </h3>
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (featuredSoftwares.length === 0) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('technologySoftware')}
          </h3>
          <p className="text-center text-gray-500 py-12">{t('noSoftware')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-4 md:py-6 ">
      <div className="w-full">
        <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
          {t('technologySoftware')}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {featuredSoftwares.slice(0, 8).map((item) => {
            const s = STATUS_COLORS[item.softwareStatus] || STATUS_COLORS.AVAILABLE;

            return (
              <div
                key={item.id}
                className="card-glow-hover p-4 md:p-5 bg-white border border-gray-200 rounded-[14px] flex flex-col gap-2 overflow-hidden cursor-pointer transition-all duration-300"
                onClick={() => handleCardClick(item.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-[42px] h-[42px] border border-indigo-200 rounded-[10px] object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-[42px] h-[42px] bg-indigo-50 border border-indigo-200 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0">
                      ⧁
                    </div>
                  )}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-[0.72rem] font-semibold text-amber-600 uppercase tracking-wider">
                      {item.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.pricingDemand}
                    </span>
                  </div>
                  {item.official && (
                    <div className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[0.68rem] font-bold text-amber-600 flex-shrink-0">
                      ✦ Official
                    </div>
                  )}
                </div>

                <h3 className="font-display text-[1.15rem] font-semibold text-gray-900 leading-tight mt-1">
                  {item.name}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-2 mb-2 flex-1">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="px-2.5 py-1 rounded-md text-xs font-semibold" 
                    style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
                  >
                    {item.softwareStatus}
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded">
                    {item.purchaseType}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="font-display text-[1.6rem] font-bold text-green-600 leading-tight">
                    {formatPrice(item.price)}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span title="Views">👁 {item.views || 0}</span>
                  </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cocreation/${item.id}`);
                      }}
                      className="btn-glow btn-glow-sm w-full sm:w-auto"
                    >
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
