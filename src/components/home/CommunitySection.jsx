import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { publicAPI } from '../../api/services';
import { filterFeaturedGuestListings } from '../../utils/homepageListings';
import { getGoogleOAuthLoginUrl } from '../../config/urls';

export default function CommunitySection() {
  const { t } = useTranslation();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getCommunities();
        setCommunities(response.data || []);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  const featuredCommunities = useMemo(
    () => filterFeaturedGuestListings(communities, 'community'),
    [communities],
  );

  const handleCardClick = (communityId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirectAfterLogin', `/community/${communityId}`);
      window.location.href = getGoogleOAuthLoginUrl();
    } else {
      window.location.href = `/community/${communityId}`;
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('disruptors')}
          </h3>
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (featuredCommunities.length === 0) {
    return (
      <section className="bg-white py-4 md:py-6 ">
        <div className="w-full">
          <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
            {t('disruptors')}
          </h3>
          <p className="text-center text-gray-500 py-12">{t('No Disruptor available yet.')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-4 md:py-6 ">
      <div className="w-full">
        <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-bold text-gray-900 mb-5 md:mb-6">
          {t('disruptors')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {featuredCommunities.slice(0, 8).map((item) => {
            const skillList = item.skills
              ? item.skills.split(',').map((s) => s.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={item.id}
                className="card-glow-hover p-4 md:p-5 bg-white border border-gray-200 rounded-[14px] flex flex-col gap-2 overflow-hidden cursor-pointer transition-all duration-300"
                onClick={() => handleCardClick(item.id)}
              >
                {/* Header: avatar + meta */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-[42px] h-[42px] border border-indigo-200 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-[42px] h-[42px] bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                      👤
                    </div>
                  )}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-[0.72rem] font-semibold text-amber-600 uppercase tracking-wider">
                      {item.role?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.industry?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {item.featured && (
                    <div className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[0.68rem] font-bold text-amber-600 flex-shrink-0">
                      ✦ Featured
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-display text-[1.15rem] font-semibold text-gray-900 leading-tight mt-1">
                  {item.name}
                </h3>

                {/* Location */}
                {item.location && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    📍 {item.location}
                  </span>
                )}

                {/* Why I'm here */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-2 flex-1">
                  {item.whyImHere}
                </p>

                {/* Skills */}
                {skillList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {skillList.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {skillList.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded">
                        +{skillList.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span title="Views">👁 {item.views || 0}</span>
                  </div>
                  <button className="btn-glow btn-glow-sm w-full sm:w-auto">
                    View Profile
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