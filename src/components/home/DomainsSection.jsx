import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useCurrency from '../../context/CurrencyContext';
import { publicAPI } from '../../api/services';
import { isPremiumDomain } from '../../utils/domainPricing';
import { isGuestCreatedListing } from '../../utils/homepageListings';
import { getGoogleOAuthLoginUrl } from '../../config/urls';
import { asArray } from '../../utils/asArray';

export default function DomainsSection() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getDomains();
        setDomains(asArray(response.data));
      } catch (error) {
        console.error('Failed to fetch domains:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDomains();
  }, []);

  const premiumDomains = useMemo(
    () => asArray(domains).filter((d) => isGuestCreatedListing(d, 'domain') && isPremiumDomain(d)),
    [domains],
  );

  const handleCardClick = (domainId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirectAfterLogin', `/domains/${domainId}`);
      window.location.href = getGoogleOAuthLoginUrl();
    } else {
      window.location.href = `/domains/${domainId}`;
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('premiumDomains')}
          </h3>
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (premiumDomains.length === 0) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('premiumDomains')}
          </h3>
          <p className="text-center text-gray-500 py-12">{t('noDomains')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-4 md:py-6 ">
      <div className="w-full">
        <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
          {t('premiumDomains')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {premiumDomains.slice(0, 8).map((domain) => {
            const isAuction = domain.saleType === 'AUCTION';
            const domainInitials = (domain.domainName || '')
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(0, 2)
              .toUpperCase() || '?';

            return (
              <div
                key={domain.id}
                className="card-glow-hover p-4 md:p-5 bg-white border border-gray-200 rounded-[14px] flex flex-col gap-3 overflow-hidden cursor-pointer transition-all duration-300"
                onClick={() => handleCardClick(domain.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-1">
                    {domain.logo ? (
                      <img 
                        src={domain.logo} 
                        alt={domain.domainName}
                        className="w-[42px] h-[42px] border rounded-[10px] object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-[42px] h-[42px] border rounded-[10px] flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        isAuction 
                          ? 'bg-purple-50 border-purple-200 text-purple-500' 
                          : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      }`}>
                        {domainInitials}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h3 className="font-display text-[1.05rem] font-bold text-gray-900 mb-0.5">
                        {domain.domainName}{domain.domainExtension}
                      </h3>
                      <span className="text-xs text-gray-500 truncate">{domain.pricingDemand}</span>
                    </div>
                  </div>

                  <div className="my-2 flex items-center gap-1.5 flex-wrap">
                    {domain.domainStatus && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                        {domain.domainStatus}
                      </span>
                    )}
                    {domain.verified && (
                      <span className="px-2.5 py-1 rounded-md text-[0.72rem] font-bold text-green-500 bg-green-50 border border-green-300">
                        ✓ Verified
                      </span>
                    )}
                    {isPremiumDomain(domain) && (
                      <span className="px-2 py-0.5 rounded text-[0.68rem] font-bold text-purple-600 bg-purple-50 border border-purple-200">
                        Premium
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <div className="text-[0.65rem] text-gray-500">Asking Price</div>
                    <div className="font-display text-[1.85rem] font-bold text-indigo-600 leading-tight tracking-[-0.01em]">
                      {formatPrice(domain.askingPrice)}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <span className="text-xs text-gray-500">{domain.domainExtension}</span>
                  <button className="btn-glow btn-glow-sm w-full sm:w-auto">
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
