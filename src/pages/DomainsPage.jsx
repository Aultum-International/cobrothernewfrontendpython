import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Plus, Gavel, ShoppingCart, MessageSquare, Trash2, CheckCircle, Share2, ArrowUpRight } from 'lucide-react';
import { domainAPI, domainEnquiryAPI, auctionAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { buildOrderCurrencyPayload } from '../utils/currencyDisplay';
import AppLayout from '../components/layout/AppLayout';
import { useLikes } from '../hooks/useLikes';
import LikeButton from '../components/common/LikeButton';
import { useFilterSort } from '../hooks/useFilterSort';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import SkeletonCard from '../components/common/Skeleton';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Confetti from '../components/common/Confetti';
import DomainsIcon from '../assets/CoBranding.png';
import AddonSelector, {addonTotal, ADDON_SERVICES} from '../components/addon/AddonSelector';
import { isPremiumDomain } from '../utils/domainPricing';
import CurrencyPriceInput from '../components/common/CurrencyPriceInput';
import { DEFAULT_LISTING_CURRENCY } from '../constants/currencies';
import { captureAppLayoutScroll, scheduleRestoreAppLayoutScroll } from '../utils/preserveAppLayoutScroll';
import {
  formatDomainApiError,
  mapDomainForUi,
  mapDomainListForUi,
  toCreateDomainListingPayload,
  isDomainListingOwner,
  validateOptionalPhone,
} from '../utils/domainPayload';
import { asArray } from '../utils/asArray';
import { APP_BASE_URL } from '../config/urls';

const DOMAIN_PRICING_OPTIONS = [
  { value: 'FIXED',      label: 'Fixed Price' },
  { value: 'NEGOTIABLE', label: 'Negotiable'  },
];

const STATUS_COLORS = {
  AVAILABLE: { color: '#6ec896', bg: 'rgba(110,200,150,0.1)', border: 'rgba(110,200,150,0.3)' },
  PENDING:   { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', border: 'rgba(200,169,110,0.3)' },
  SOLD:      { color: '#c86e6e', bg: 'rgba(200,110,110,0.1)', border: 'rgba(200,110,110,0.3)' },
};

export default function DomainsPage() {
  const { t } = useTranslation();
  const { user }  = useAuth();
  const { currency, getSymbol } = useCurrency();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();

  const [allDomains, setAllDomains]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [buyTarget, setBuyTarget]           = useState(null);
  const [successDomain, setSuccessDomain]   = useState(null);
  const [detailTarget, setDetailTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [enquireTarget, setEnquireTarget]   = useState(null);
  const [enquireSuccess, setEnquireSuccess] = useState(false);
  const [filterTab, setFilterTab]           = useState('all');
  const [showConfetti, setShowConfetti]     = useState(false);

  const { toggle: toggleLike, get: getLike } = useLikes('DOMAIN', allDomains);

  const domainRows = asArray(allDomains);
  const visibleDomains = filterTab === 'mine'
    ? domainRows
    : domainRows.filter(d => !d.takenDown && !isPremiumDomain(d));

  const {
    paginated, totalCount,
    search, category, minPrice, maxPrice, sortBy,
    handleSearch, handleCategory, handleMinPrice, handleMaxPrice, handleSort,
    clearAll, activeFilterCount,
    page, totalPages, setPage,
  } = useFilterSort(visibleDomains, {
    searchFields:  ['domainName', 'domainExtension'],
    priceField:    'askingPrice',
    categoryField: 'pricingDemand',
    dateField:     'createdAt',
  }, 20);

  useEffect(() => {
  setLoading(true);

  const req = filterTab === 'mine' ? domainAPI.getMyListings() : domainAPI.getAll();

  req
    .then(({ data }) =>
      setAllDomains(mapDomainListForUi(data))
    )
    .catch(() => setAllDomains([]))
    .finally(() => setLoading(false));
}, [filterTab]);

  useEffect(() => {
    if (searchParams.get('tab') === 'mine') setFilterTab('mine');
  }, [searchParams]);

  const refreshDomains = () => {
    const req = filterTab === 'mine' ? domainAPI.getMyListings() : domainAPI.getAll();
    return req.then(({ data }) => setAllDomains(mapDomainListForUi(data)));
  };

  const handleDelete = async () => {
    try {
      await domainAPI.delete(deleteTarget);
      setAllDomains(d => asArray(d).filter(x => x.id !== deleteTarget));
      await refreshDomains();
    } catch (e) {
      alert(formatDomainApiError(e) || 'Failed to remove listing.');
    } finally { setDeleteTarget(null); }
  };
  return (
    <AppLayout>
      <Confetti show={showConfetti} />
      {showConfetti && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 text-center max-w-sm mx-4 animate-slideUp">
            <div className="text-5xl mb-3">🌐</div>
            <h2 className="font-display text-2xl font-extrabold text-gray-900 mb-1">Domain Listed!</h2>
            <p className="text-sm text-gray-500">Your domain is now live on the marketplace.</p>
          </div>
        </div>
      )}
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 m-0">{t('domains')}</h1>
            <p className="text-gray-600 mt-1">{t('buyAndSellDomains')}</p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button className="btn-glow btn-glow-sm flex items-center gap-1.5 md:gap-2 text-xs md:text-sm py-2 px-2 md:py-2 md:px-3" onClick={() => navigate('/domains/dashboard')}>
              <LayoutDashboard size={14} className="md:w-4 md:h-4" /> <span className="truncate">{t('dashboard')}</span>
            </button>
            <button className="btn-glow btn-glow-sm flex items-center gap-1.5 md:gap-2 text-xs md:text-sm py-2 px-2 md:py-2 md:px-3" onClick={() => setShowForm(true)}>
              <Plus size={14} className="md:w-4 md:h-4" /> <span className="truncate">{t('listDomain')}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button className={`btn-glow btn-glow-sm text-xs md:text-sm py-2 px-2 md:py-2 md:px-3 ${filterTab === 'all' ? 'bg-gray-900 text-white border-gray-900' : ''}`}
            onClick={() => { setFilterTab('all'); setShowForm(false); }}>{t('allDomains')}</button>
          <button className={`btn-glow btn-glow-sm text-xs md:text-sm py-2 px-2 md:py-2 md:px-3 ${filterTab === 'mine' ? 'bg-gray-900 text-white border-gray-900' : ''}`}
            onClick={() => { setFilterTab('mine'); setShowForm(false); }}>{t('myListings')}</button>
        </div>

        {showForm && (
          <div className="mb-6">
            <DomainForm
              onSaved={d => {
                const snap = captureAppLayoutScroll();
                flushSync(() => {
                  setAllDomains(prev => [d, ...prev]);
                  setShowForm(false);
                  setShowConfetti(true);
                });
                scheduleRestoreAppLayoutScroll(snap);
                setTimeout(() => setShowConfetti(false), 4000);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <FilterBar
          search={search}           onSearch={handleSearch}
          category={category}       onCategory={handleCategory}
          categoryOptions={DOMAIN_PRICING_OPTIONS}
          minPrice={minPrice}       onMinPrice={handleMinPrice}
          maxPrice={maxPrice}       onMaxPrice={handleMaxPrice}
          sortBy={sortBy}           onSort={handleSort}
          onClear={clearAll}        activeFilterCount={activeFilterCount}
          placeholder="Search domains by name or extension…"
          priceSymbol={getSymbol(currency)}
          theme="light"
        />

        {!loading && totalCount > 0 && (
          <div className="text-sm text-gray-600 mb-4">
            {totalCount} domain{totalCount !== 1 ? 's' : ''} found
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20">
            <img src={DomainsIcon} alt="Domain" className="mx-auto mb-4 w-16 h-16 object-contain" />
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
              {activeFilterCount > 0 ? 'No domains match your filters' :
               filterTab === 'mine' ? 'You have no active listings' :
               'No domains listed yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeFilterCount > 0
                ? 'Try adjusting your search or filters.'
                : 'Be the first to list a domain for sale.'}
            </p>
            {activeFilterCount > 0
              ? <button className="btn-glow btn-glow-sm" onClick={clearAll}>Clear Filters</button>
              : <button className="btn-glow btn-glow-sm" onClick={() => setShowForm(true)}>
                  List a Domain
                </button>
            }
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {paginated.map(d => (
                <DomainCard
                  key={d.id}
                  domain={d}
                  isOwner={isDomainListingOwner(d, user, filterTab)}
                  likeState={getLike(d.id)}
                  onLike={() => toggleLike(d.id)}
                  onView={() => setDetailTarget(d)}
                  onBuy={() => setBuyTarget(d)}
                  onEnquire={() => setEnquireTarget(d)}
                  onViewAuction={() => navigate(`/auction/${d.auction?.id}`)}
                  onEdit={() => navigate(`/domains/${d.id}/edit`)}
                  onDelete={() => setDeleteTarget(d.id)}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages}
              onPage={setPage} totalCount={totalCount} pageSize={20} />
          </>
        )}
      </div>

      {buyTarget && (
        <BuyDomainModal
          domain={buyTarget}
          onClose={() => setBuyTarget(null)}
          onSuccess={d => {
            setSuccessDomain(d);
            setBuyTarget(null);
            setAllDomains(prev => prev.map(x => x.id === d.id ? d : x));
          }}
        />
      )}

      {successDomain && (
        <PurchaseSuccessModal domain={successDomain} onClose={() => setSuccessDomain(null)} />
      )}

      {detailTarget && (
        <DomainDetailModal
          domain={detailTarget}
          isOwner={isDomainListingOwner(detailTarget, user, filterTab)}
          likeState={getLike(detailTarget.id)}
          onLike={() => toggleLike(detailTarget.id)}
          onClose={() => { setDetailTarget(null); refreshDomains(); }}
          onBuy={() => { setBuyTarget(detailTarget); setDetailTarget(null); }}
          onEnquire={() => { setEnquireTarget(detailTarget); setDetailTarget(null); }}
          onEdit={() => {
            navigate(`/domains/${detailTarget.id}/edit`);
            setDetailTarget(null);
          }}
          onDelete={() => {
            setDeleteTarget(detailTarget.id);
            setDetailTarget(null);
          }}
          onViewAuction={() => {
            navigate(`/auction/${detailTarget.auction?.id}`);
            setDetailTarget(null);
          }}
        />
      )}

      {enquireTarget && (
        <DomainEnquiryModal
          domain={enquireTarget}
          user={user}
          onClose={() => setEnquireTarget(null)}
          onSuccess={() => { setEnquireTarget(null); setEnquireSuccess(true); }}
        />
      )}

      {enquireSuccess && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEnquireSuccess(false)}>
          <div className="relative w-full max-w-[420px] text-center bg-white border border-gray-200 rounded-[18px] shadow-[0_20px_60px_rgba(17,24,39,0.16)] p-8">
            <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />
            <div className="text-green-600 flex justify-center mb-4"><CheckCircle size={46} /></div>
            <h2 className="font-display text-[1.75rem] text-gray-900 mb-2">Enquiry Submitted!</h2>
            <p className="text-gray-500 mb-6">
              Our team will review your request and get back to you shortly.
            </p>
            <button className="btn-glow w-full" onClick={() => setEnquireSuccess(false)}>Done</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Domain Listing?"
        message="This will remove your domain from the marketplace. You can re-list it later."
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}

// ─── Domain Card ──────────────────────────────────────────────────────────────
function DomainCard({ domain, isOwner, onView, onBuy, onEnquire, onViewAuction,
                       onEdit, onDelete, likeState, onLike }) {
  const { formatPrice } = useCurrency();
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);
  const s           = STATUS_COLORS[domain.domainStatus] || STATUS_COLORS.AVAILABLE;
  const isAuction   = domain.saleType === 'AUCTION';
  const isHighValue = isPremiumDomain(domain);
  const auction     = domain.auction;
  const auctionLive = auction?.status === 'ACTIVE' || auction?.status === 'EXTENDED';
  const domainInitials = (domain.domainName || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase() || '?';

  // Close share dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
// Share URL when `window` is undefined (SSR); browser uses `window.location.origin`.
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/domains`
      : `${APP_BASE_URL.replace(/\/$/, '')}/domains`;
  const shareText = `Check out this domain: ${domain.domainName}${domain.domainExtension} - Listed on CoBrother!`;

  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleShare = (platform) => {
    window.open(platform, '_blank', 'width=600,height=400');
    setShareOpen(false);
  };

  const accentGrad = isAuction
    ? 'from-purple-600 via-fuchsia-500 to-pink-500'
    : 'from-indigo-600 via-blue-500 to-cyan-400';

  return (
    <div
      className="card-glow-hover group relative bg-white rounded-2xl overflow-hidden cursor-pointer flex flex-col border border-gray-200 shadow-sm transition-all duration-300"
      onClick={onView}
    >
      {/* Gradient header with large image */}
      <div className={`relative bg-gradient-to-r ${accentGrad} px-4 pt-3.5 pb-3.5 min-h-[90px] flex items-end`}>
        {domain.logo
          ? <img src={domain.logo} alt={domain.domainName}
              className="absolute top-0 right-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
          : null
        }
        <div className="relative z-10 flex items-end justify-between w-full">
          <div className="flex items-center gap-2">
            {domain.logo
              ? <img src={domain.logo} alt={domain.domainName}
                  className="w-14 h-14 rounded-xl object-cover ring-[3px] ring-white/50 shadow-lg" />
              : <div className="w-14 h-14 rounded-xl flex items-center justify-center font-display text-2xl font-extrabold text-white ring-[3px] ring-white/30 shadow-lg bg-white/15 backdrop-blur-sm">
                  {domainInitials}
                </div>
            }
            <div>
              <span className={`px-2 py-[3px] text-[10px] font-bold rounded-md uppercase tracking-wide ${isAuction ? 'bg-yellow-400 text-gray-900' : 'bg-white/25 backdrop-blur-sm text-white'}`}>
                {isAuction ? '🔨 Auction' : domain.domainExtension}
              </span>
              {isOwner && (
                <span className="ml-1.5 px-2 py-[3px] bg-white text-indigo-600 text-[10px] font-extrabold rounded-md uppercase tracking-wide shadow-sm">
                  ✦ Owner
                </span>
              )}
            </div>
          </div>
        </div>
        {domain.takenDown && (
          <span className="absolute top-3 right-3 z-10 px-2 py-[3px] bg-red-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wide shadow-sm">
            ⚠ Taken Down
          </span>
        )}
      </div>

      {/* Body */}
      <div className="relative px-4 pb-4 pt-3 flex flex-col flex-1">
        {/* Domain name + status/pricing tags on right */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-[0.95rem] font-extrabold text-gray-900 truncate leading-snug">
            {domain.domainName}{domain.domainExtension}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isAuction && (
              <span className={`px-1.5 py-[2px] text-[9px] font-bold rounded uppercase tracking-wide border ${
                domain.domainStatus === 'AVAILABLE' ? 'bg-green-50 text-green-600 border-green-200' :
                domain.domainStatus === 'SOLD'      ? 'bg-red-50 text-red-500 border-red-200' :
                                                      'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {domain.domainStatus}
              </span>
            )}
            <span className="px-1.5 py-[2px] bg-gray-100 text-gray-500 text-[9px] font-bold rounded uppercase tracking-wide whitespace-nowrap">
              {domain.pricingDemand || 'Fixed'}
            </span>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {domain.verified && (
            <span className="px-2 py-[2px] text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md">
              ✓ Verified
            </span>
          )}
          {isHighValue && domain.domainStatus === 'AVAILABLE' && (
            <span className="px-2 py-[2px] text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-md">
              Premium
            </span>
          )}
          {isAuction && (
            <>
              {auction?.status === 'ACTIVE'   && <span className="text-[10px] text-emerald-600 font-bold">🟢 Live</span>}
              {auction?.status === 'EXTENDED' && <span className="text-[10px] text-amber-500 font-bold">⚡ Extended</span>}
              {auction?.status === 'DRAFT'    && <span className="text-[10px] text-gray-400">⏳ Draft</span>}
            </>
          )}
        </div>

        {/* Price block */}
        {isAuction && auction ? (
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 px-3 py-2 mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-purple-700 tracking-tight">
                {formatPrice(auction.currentHighestBid > 0 ? auction.currentHighestBid : auction.minBidPrice)}
              </span>
              <span className="text-[10px] text-purple-400 font-semibold">
                {auction.currentHighestBid > 0 ? 'highest' : 'min bid'}
              </span>
            </div>
            <span className="text-[10px] text-purple-400">{auction.totalBids} bid{auction.totalBids !== 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-3 py-2 mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-emerald-700 tracking-tight">
                {formatPrice(domain.askingPrice)}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">asking price</span>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2.5 text-[11px] text-gray-400 font-medium py-2 border-t border-gray-100 mt-auto">
          <span className="flex items-center gap-1">👁 {domain.views || 0}</span>
          <LikeButton liked={likeState?.liked} count={likeState?.count} onToggle={onLike} />

          {isOwner ? (
            <div className="flex gap-1.5 ml-auto flex-wrap items-center" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="inline-flex items-center justify-center px-2.5 py-1 bg-white text-gray-700 font-semibold text-[10px] rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={onEdit}
              >
                Edit
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 font-semibold text-[10px] rounded-lg hover:bg-red-100"
                onClick={onDelete}
              >
                <Trash2 size={11} className="mr-0.5" /> Remove
              </button>
              <div className="relative" ref={shareRef}>
                <button
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  onClick={(e) => { e.stopPropagation(); setShareOpen(!shareOpen); }}
                  title="Share"
                >
                  <Share2 size={13} />
                </button>
                {shareOpen && (
                  <div className="absolute right-0 bottom-full mb-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[150px]">
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                      <span className="text-[10px] font-semibold text-gray-500">Share via</span>
                    </div>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleShare(linkedinShare); }}>
                      LinkedIn
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleShare(facebookShare); }}>
                      Facebook
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleShare(whatsappShare); }}>
                      WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : domain.domainStatus === 'AVAILABLE' ? (
                isHighValue ? (
                  <button
                    onClick={e => { e.stopPropagation(); onEnquire(); }}
                    className={`flex-1 py-2 bg-gradient-to-r ${accentGrad} text-white text-xs font-bold rounded-lg transition-all hover:opacity-90 inline-flex items-center justify-center gap-1.5`}>
                    <MessageSquare size={13} /> Enquire
                  </button>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); onBuy(); }}
                    className={`flex-1 py-2 bg-gradient-to-r ${accentGrad} text-white text-xs font-bold rounded-lg transition-all hover:opacity-90 inline-flex items-center justify-center gap-1.5`}>
                    <ShoppingCart size={13} /> Buy Now
                  </button>
                )
              ) : (
                <span className="flex-1 py-2 text-center text-[11px] text-gray-400 font-medium">
                  {domain.domainStatus === 'SOLD' ? 'Sold' : 'Pending'}
                </span>
              )}
        </div>
      </div>
    </div>
  );
}

// ─── Domain Form ──────────────────────────────────────────────────────────────
function DomainForm({ onSaved, onCancel }) {
  const { currency: navCurrency } = useCurrency();
  const [form, setForm] = useState({
    domainName: '', domainExtension: '',
    askingPrice: '', pricingDemand: '',
    currency: navCurrency || DEFAULT_LISTING_CURRENCY,
    saleType: 'ONE_TIME', minBidPrice: '', auctionDuration: 'SEVEN_DAYS',
    contactInfo: { email: '', phoneNumber: '' },
    agreement: { terms: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [savedDomain, setSavedDomain]       = useState(null);
  const [imageFile, setImageFile]           = useState(null);
  const [imagePreview, setImagePreview]     = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError]         = useState('');
  const fileInputRef                        = useRef(null);

  const setContact = (k, v) =>
    setForm(f => ({ ...f, contactInfo: { ...f.contactInfo, [k]: v } }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.saleType === 'AUCTION' && (!form.minBidPrice || parseFloat(form.minBidPrice) <= 0)) {
      setError('Please enter a valid minimum bid price.');
      return;
    }
    const phoneCheck = validateOptionalPhone(form.contactInfo.phoneNumber);
    if (!phoneCheck.ok) {
      setError(phoneCheck.error);
      return;
    }
    setLoading(true); setError('');
    try {
      const payload = toCreateDomainListingPayload(form);
      const { data } = await domainAPI.createListing(payload);
      const domain = mapDomainForUi(data);
      if (form.saleType === 'AUCTION' && domain.id) {
        await auctionAPI.create(domain.id, {
          minBidPrice: parseFloat(form.minBidPrice),
          duration:    form.auctionDuration,
        });
      }
      setSavedDomain(domain);
    } catch (err) {
      setError(formatDomainApiError(err) || 'Failed to list domain.');
    } finally { setLoading(false); }
  };

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageError('Only image files are allowed.'); return; }
    setImageError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imageFile || !savedDomain) return;
    setImageUploading(true); setImageError('');
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const { data } = await domainAPI.uploadImage(savedDomain.id, formData);
      onSaved({ ...savedDomain, logo: data.logoUrl });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 501) {
        setImageError('Logo upload is not available until Supabase Storage is configured. Click Skip to finish.');
      } else {
        setImageError(formatDomainApiError(err) || 'Upload failed. You can skip and add a logo later.');
      }
      setImageUploading(false);
    }
  };

  const handleSkip = () => onSaved(savedDomain);

  const isAuction = form.saleType === 'AUCTION';

  const inputCls = 'px-3 py-2 border border-gray-300 rounded-[8px] text-gray-800 bg-white outline-none focus:border-purple-500 transition-all w-full placeholder:text-gray-400';
  const labelCls = 'text-sm font-medium text-gray-700';

  if (savedDomain) {
    return (
      <div className="p-8 bg-white border border-gray-200 rounded-[18px] shadow-sm">
        <h3 className="font-display text-2xl text-gray-900 font-semibold">
          Add a Logo <span className="text-sm text-gray-400 font-normal">(optional)</span>
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Upload a logo for <strong className="text-purple-600">{savedDomain.domainName}{savedDomain.domainExtension}</strong>. You can also do this later.
        </p>
        <div className="mt-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-3 ${
              imagePreview ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-gray-50 hover:border-gray-400'
            }`}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-[120px] max-w-full rounded-lg object-contain mx-auto" />
            ) : (
              <>
                <div className="text-4xl mb-2">🖼</div>
                <div className="text-sm text-gray-500">Click to choose an image</div>
                <div className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</div>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {imagePreview && (
            <button type="button" className="text-xs text-gray-500 hover:text-red-500 mb-3"
              onClick={() => { setImageFile(null); setImagePreview(null); }}>✕ Remove</button>
          )}
          {imageError && <div className="text-sm text-red-500 mb-3">{imageError}</div>}
          <div className="flex gap-3">
            <button type="button" className="btn-glow flex-1"
              disabled={!imageFile || imageUploading} onClick={handleImageUpload}>
              {imageUploading ? <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin inline-block" /> : 'List Your Domain →'}
            </button>
            <button type="button" className="btn-glow" onClick={handleSkip}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white border border-gray-200 rounded-[18px] shadow-sm">
      <h3 className="font-display text-2xl text-gray-900 font-semibold">List Your Domain</h3>
      <p className="text-gray-500 text-sm mt-1">Fill in the details to list your domain for sale.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Domain Name <span className="text-red-500">*</span></label>
          <input className={inputCls}
            value={form.domainName + form.domainExtension}
            onChange={e => {
              const full = e.target.value;
              const dot  = full.indexOf('.');
              if (dot !== -1) {
                setForm(f => ({ ...f, domainName: full.slice(0, dot), domainExtension: full.slice(dot) }));
              } else {
                setForm(f => ({ ...f, domainName: full, domainExtension: '' }));
              }
            }}
            placeholder="e.g. mybrand.com" required
          />
          <span className="text-xs text-gray-500 mt-1 block">
            Include the extension (e.g. .com, .in, .io)
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Sale Type <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            {[
              { value: 'ONE_TIME', label: '🛒 One-Time Sale', desc: 'Set a fixed price. Buyer pays and gets the domain.' },
              { value: 'AUCTION',  label: '🔨 Auction',       desc: 'Bidders compete. Highest bid wins after your chosen duration.' },
            ].map(opt => (
              <div key={opt.value}
                onClick={() => setForm(f => ({ ...f, saleType: opt.value }))}
                className={`p-3.5 rounded-lg cursor-pointer border-2 transition-all duration-150 ${
                  form.saleType === opt.value 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-gray-200 bg-white'
                }`}>
                <div className={`font-semibold text-sm mb-1 ${
                  form.saleType === opt.value ? 'text-purple-600' : 'text-gray-600'
                }`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-500 leading-snug">{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!isAuction && (
            <CurrencyPriceInput
              id="domain-asking-price"
              label="Asking Price"
              value={form.askingPrice}
              onChange={(v) => setForm((f) => ({ ...f, askingPrice: v }))}
              currency={form.currency}
              onCurrencyChange={(code) => setForm((f) => ({ ...f, currency: code }))}
              required={!isAuction}
              inputClassName={inputCls}
              labelClassName={labelCls}
            />
          )}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Pricing Type <span className="text-red-500">*</span></label>
            <select className={inputCls} value={form.pricingDemand}
              onChange={e => setForm(f => ({ ...f, pricingDemand: e.target.value }))} required>
              <option value="">Select pricing type</option>
              <option value="FIXED">Fixed Price</option>
              <option value="NEGOTIABLE">Negotiable</option>
            </select>
          </div>
        </div>

        {isAuction && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <CurrencyPriceInput
                  id="domain-min-bid"
                  label="Minimum Bid"
                  value={form.minBidPrice}
                  onChange={(v) => setForm((f) => ({ ...f, minBidPrice: v }))}
                  currency={form.currency}
                  onCurrencyChange={(code) => setForm((f) => ({ ...f, currency: code }))}
                  required
                  placeholder="e.g. 5000"
                  inputClassName={inputCls}
                  labelClassName={labelCls}
                />
                <span className="text-[0.72rem] text-gray-500 mt-1 block">
                  Each subsequent bid must be at least 5% higher.
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Auction Duration <span className="text-red-500">*</span></label>
                <select className={inputCls} value={form.auctionDuration}
                  onChange={e => setForm(f => ({ ...f, auctionDuration: e.target.value }))}>
                  <option value="ONE_DAY">1 Day</option>
                  <option value="SEVEN_DAYS">7 Days</option>
                  <option value="FIFTEEN_DAYS">15 Days</option>
                  <option value="THIRTY_DAYS">30 Days</option>
                </select>
              </div>
            </div>
            <div className="p-3.5 bg-amber-100 border border-amber-400 rounded-lg text-[0.82rem] text-amber-900 leading-relaxed">
              ⚡ Auction domains go live only after domain verification (≈15 mins). Your listing
              stays in <strong>Draft</strong> until verification is complete, then the auction
              timer starts automatically.
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Contact Email <span className="text-red-500">*</span></label>
            <input className={inputCls} type="email" value={form.contactInfo.email}
              onChange={e => setContact('email', e.target.value)}
              placeholder="your@email.com" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input className={inputCls} value={form.contactInfo.phoneNumber}
              onChange={e => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                setContact('phoneNumber', value);
              }}
              type="tel"
              inputMode="numeric"
              pattern="\d{10}"
              title="10-digit mobile number, or leave empty"
              placeholder="e.g. 9876543210"
              maxLength={10} />
          </div>
        </div>

        <label className="inline-flex items-center gap-3 cursor-pointer self-start rounded-[12px] border border-purple-100 bg-purple-50/60 px-3.5 py-2.5 max-w-full">
          <input
            type="checkbox"
            checked={form.agreement.terms}
            onChange={e => setForm(f => ({ ...f, agreement: { terms: e.target.checked } }))}
            required
            className="peer sr-only"
          />
          <span className="relative w-5 h-5 rounded-[7px] border-2 border-purple-300 bg-white flex items-center justify-center flex-shrink-0 transition-all" style={{ backgroundColor: form.agreement.terms ? '#9333ea' : 'white', borderColor: form.agreement.terms ? '#9333ea' : '#d8b4fe' }}>
            {form.agreement.terms && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="4" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </span>
          <span className="text-sm text-gray-700 leading-snug">I confirm I own this domain and agree to the Terms & Conditions.</span>
        </label>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex gap-3 mt-2">
          <button type="submit" className="btn-glow flex-1" disabled={loading}>
            {loading ? <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin inline-block" /> :
              isAuction ? 'List for Auction →' : 'Add Logo →'}
          </button>
          <button type="button" className="btn-glow" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ─── Buy Domain Modal ─────────────────────────────────────────────────────────
function BuyDomainModal({ domain, onClose, onSuccess }) {
  const { user } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [addons, setAddons]   = useState([]);

  const addonExtra  = addonTotal(addons);
  const domainPrice = Number(domain.askingPrice);
  const totalPrice  = domainPrice + addonExtra;

  const handleBuy = async () => {
    setLoading(true); setError('');
    try {
      const { data: orderData } = await domainAPI.createOrder(domain.id, {
        services: addons,
        ...buildOrderCurrencyPayload(currency),
      });
      openRazorpayCheckout({
        orderData,
        user,
        description: `Purchase ${domain.domainName}${domain.domainExtension}`,
        onSuccess: async (response) => {
          try {
            await domainAPI.verifyPayment(domain.id, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId:   response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            onSuccess({
              ...domain,
              domainStatus:  'SOLD',
              paymentStatus: 'COMPLETED',
              _addons:       addons,
            });
          } catch {
            setError('Payment verification failed. Contact support.');
            setLoading(false);
          }
        },
        onFailure: async () => {
          await domainAPI.handleFailure(domain.id);
          setError('Payment failed. Please try again.');
          setLoading(false);
        },
        onDismiss: async () => {
          await domainAPI.handleFailure(domain.id);
          setLoading(false);
        },
      });
    } catch (err) {
      const body = err.response?.data;
      const msg =
        (typeof body === 'string' && body) ||
        body?.message ||
        body?.error ||
        (body?.success === false && body?.message) ||
        'Failed to initiate payment.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white border border-gray-200 rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-8 overflow-x-hidden">
        <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />
        <button className="absolute top-4 right-4 z-20 bg-transparent border-none text-gray-400 text-xl cursor-pointer transition-colors hover:text-gray-700" onClick={onClose}>✕</button>

        <div className="mb-5">
          <div className="inline-flex items-center px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-[0.72rem] font-semibold text-indigo-600 uppercase tracking-wide mb-2">Domain Purchase</div>
          <h2 className="font-display text-[1.75rem] font-semibold text-gray-900 mb-1">{domain.domainName}{domain.domainExtension}</h2>
          <p className="text-sm text-gray-500">{domain.pricingDemand}</p>
        </div>

        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-[0.82rem] text-amber-800 leading-relaxed mb-4">
          ⏳ After payment, you will be updated within <strong>24 hours</strong> with transfer details.
        </div>

        {/* ── Add-on selector ── */}
        <AddonSelector selected={addons} onChange={setAddons} />

        {/* ── Billing breakdown ── */}
        <div className="mt-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
          <div className="text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">Billing Breakdown</div>
          <div className="flex justify-between text-gray-600 mb-1">
            <span>{domain.domainName}{domain.domainExtension}</span>
            <span>{formatPrice(domainPrice)}</span>
          </div>
          {addons.filter(k => !ADDON_SERVICES.find(s => s.key === k)?.contactOnly).map(k => {
            const svc = ADDON_SERVICES.find(s => s.key === k);
            return svc ? (
              <div key={k} className="flex justify-between text-indigo-600 mb-1">
                <span className="truncate mr-2">{svc.label}</span>
                <span>{formatPrice(svc.price)}</span>
              </div>
            ) : null;
          })}
          {addons.some(k => ADDON_SERVICES.find(s => s.key === k)?.contactOnly) && (
            <div className="text-xs text-amber-600 mb-1">+ contact-based services (no extra charge)</div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {error && <div className="text-sm text-red-500 mt-4 mb-2">{error}</div>}

        <div className="flex gap-3 mt-5">
          <button type="button" className="btn-glow flex-1" onClick={handleBuy} disabled={loading}>
            {loading
              ? <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin inline-block" />
              : `Pay ${formatPrice(totalPrice)} →`}
          </button>
          <button type="button" className="btn-glow" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}


// ─── Purchase Success Modal ───────────────────────────────────────────────────
function PurchaseSuccessModal({ domain, onClose }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[440px] text-center bg-white border border-gray-200 rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-8">
        <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-display text-[1.75rem] font-semibold text-gray-900 mb-2">Purchase Successful!</h2>
        <p className="text-gray-500 mb-5">
          You've successfully purchased{' '}
          <strong className="text-gray-900">{domain.domainName}{domain.domainExtension}</strong>
        </p>
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-[0.82rem] text-amber-800 leading-relaxed mb-6">
          ⏳ A confirmation email has been sent. The seller will initiate the domain transfer
          within <strong>24 hours</strong>.
        </div>
        <button className="btn-glow w-full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

// ─── Domain Detail Modal ──────────────────────────────────────────────────────
function DomainDetailModal({ domain, isOwner, onClose, onBuy, onEnquire,
                              onViewAuction, onEdit, onDelete, likeState, onLike }) {
  const { formatPrice } = useCurrency();
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched            = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    domainAPI.getListing(domain.id)
      .then(({ data }) => setDetail(mapDomainForUi(data)))
      .catch(() => setDetail(domain))
      .finally(() => setLoading(false));
  }, [domain.id]);

  const d           = detail || domain;
  const c           = d.contactInfo || {};
  const s           = STATUS_COLORS[d.domainStatus] || STATUS_COLORS.AVAILABLE;
  const isAuction   = d.saleType === 'AUCTION';
  const isHighValue = isPremiumDomain(d);
  const auction     = d.auction;
  const auctionLive = auction?.status === 'ACTIVE' || auction?.status === 'EXTENDED';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white border border-gray-200 rounded-[18px] shadow-[0_20px_60px_rgba(17,24,39,0.16)] p-8">
        <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />
        <button className="absolute top-4 right-4 z-20 bg-transparent border-none text-gray-400 text-xl cursor-pointer transition-colors hover:text-gray-700" onClick={onClose}>✕</button>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="inline-flex items-center px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-[0.72rem] font-semibold text-indigo-600 uppercase tracking-wide">{isAuction ? '🔨 Auction' : 'Domain'}</div>
                {d.verified && (
                  <span className="px-2 py-0.5 rounded text-[0.68rem] font-bold text-green-600 bg-green-50 border border-green-300">
                    ✓ Verified
                  </span>
                )}
                {isHighValue && (
                  <span className="px-2 py-0.5 rounded text-[0.68rem] font-bold text-purple-600 bg-purple-50 border border-purple-200">
                    Premium
                  </span>
                )}
              </div>
              <h2 className="font-display text-[1.75rem] font-semibold text-gray-900 mb-1">{d.domainName}{d.domainExtension}</h2>
              <p className="text-sm text-gray-500">{d.pricingDemand}</p>
            </div>

            <div className="flex gap-2 flex-wrap mb-4">
              {isAuction && auction ? (
                <>
                  <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-[0.82rem] text-green-800">
                    {auction.currentHighestBid > 0
                      ? `🏆 ${formatPrice(auction.currentHighestBid)}`
                      : `🔨 Min ${formatPrice(auction.minBidPrice)}`}
                  </div>
                  <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[0.82rem] text-gray-600">
                    📋 {auction.totalBids} bid{auction.totalBids !== 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-[0.82rem] text-green-800">
                  💰 {formatPrice(d.askingPrice)}
                </div>
              )}
              <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[0.82rem] text-gray-600">
                👁 {d.views || 0} views
              </div>
              {!isAuction && (
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                  {d.domainStatus}
                </span>
              )}
            </div>

            {isAuction && auction && (
              <Section title="Auction Info">
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem label="Status"
                    value={auction.status === 'ACTIVE'   ? '🟢 Live' :
                           auction.status === 'EXTENDED' ? '⚡ Extended' :
                           auction.status === 'DRAFT'    ? '⏳ Pending Verification' :
                           auction.status} />
                  <DetailItem label="Duration" value={auction.duration?.replace(/_/g, ' ')} />
                  {auction.endTime && (
                    <DetailItem label="Ends"
                      value={new Date(
                        auction.endTime.endsWith('Z') ? auction.endTime : auction.endTime + 'Z'
                      ).toLocaleDateString('en-IN',
                        { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
                  )}
                  {auction.currentHighestBid > 0 && (
                    <DetailItem label="Next Min Bid"
                      value={formatPrice(auction.currentHighestBid * 1.05)} />
                  )}
                </div>
              </Section>
            )}

            {isHighValue && !isOwner && d.domainStatus === 'AVAILABLE' && (
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-lg mb-5 text-[0.83rem] text-purple-700">
                ❆ This is a premium domain. Submit an enquiry and our team will facilitate
                the transaction.
              </div>
            )}

            {(c.email || c.phoneNumber) && (
              <Section title="Contact">
                <div className="grid grid-cols-2 gap-3">
                  {c.email       && <DetailItem label="Email" value={c.email} />}
                  {c.phoneNumber && <DetailItem label="Phone" value={c.phoneNumber} />}
                </div>
              </Section>
            )}

            {d.listedBy && (
              <Section title="Listed By">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600">
                    {d.listedBy.firstname?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="font-semibold text-gray-900 text-[0.9rem]">
                    {d.listedBy.firstname} {d.listedBy.lastname}
                  </div>
                </div>
              </Section>
            )}

            <div className="flex gap-3 mt-6 flex-wrap items-center">
              {isOwner && (
                <>
                  <button type="button" className="btn-glow btn-glow-sm" onClick={onEdit}>
                    Edit listing
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 bg-red-50 border border-red-200 text-red-600 font-semibold text-sm rounded-lg hover:bg-red-100"
                    onClick={onDelete}
                  >
                    <Trash2 size={14} className="mr-1" /> Remove
                  </button>
                </>
              )}
              {!isOwner && (
                isAuction ? (
                  auctionLive ? (
                    <button
                      onClick={onViewAuction}
                      className="btn-glow btn-glow-sm">
                      🔨 Go to Auction →
                    </button>
                  ) : null
                ) : d.domainStatus === 'AVAILABLE' ? (
                  isHighValue ? (
                    <button
                      onClick={onEnquire}
                      className="btn-glow btn-glow-sm">
                      Enquire Now →
                    </button>
                  ) : (
                    <button className="btn-glow btn-glow-sm" onClick={onBuy}>Buy Now →</button>
                  )
                ) : null
              )}
              <LikeButton liked={likeState?.liked} count={likeState?.count}
                          onToggle={onLike} size="md" />
              <button className="btn-glow btn-glow-sm" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Domain Enquiry Modal ─────────────────────────────────────────────────────
function DomainEnquiryModal({ domain, user, onClose, onSuccess }) {
  const { formatPrice } = useCurrency();
  const [form, setForm] = useState({
    fullName: `${user?.firstname || ''} ${user?.lastname || ''}`.trim(),
    email:    user?.email || '',
    phone:    user?.phoneNumber || '',
    message:  '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Correct signature: (domainId, { fullName, email, phone, message })
      await domainEnquiryAPI.submit(domain.id, {
        fullName: form.fullName,
        email:    form.email,
        phone:    form.phone,
        message:  form.message,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit enquiry.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[500px] bg-white border border-gray-200 rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-8">
        <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />
        <button className="absolute top-4 right-4 z-20 bg-transparent border-none text-gray-400 text-xl cursor-pointer transition-colors hover:text-gray-700" onClick={onClose}>✕</button>
        <div className="mb-6">
          <div className="inline-flex items-center px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-[0.72rem] font-semibold text-indigo-600 uppercase tracking-wide mb-2">Domain Enquiry</div>
          <h2 className="font-display text-[1.75rem] font-semibold text-gray-900 mb-1">{domain.domainName}{domain.domainExtension}</h2>
          <p className="text-sm text-gray-500">{formatPrice(domain.askingPrice)} · {domain.pricingDemand}</p>
        </div>
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg mb-5 text-[0.83rem] text-amber-800">
          ⚡ For high-value domains, our team will facilitate the transaction.
          Fill in your details and we'll be in touch shortly.
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
            <input className="px-3 py-2 border border-gray-300 rounded-[8px] text-gray-900 bg-white outline-none focus:border-purple-500 transition-all" value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Your full name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <input className="px-3 py-2 border border-gray-300 rounded-[8px] text-gray-900 bg-white outline-none focus:border-purple-500 transition-all" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
              <input className="px-3 py-2 border border-gray-300 rounded-[8px] text-gray-900 bg-white outline-none focus:border-purple-500 transition-all" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit number" maxLength={10} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Message / Reason for Enquiry <span className="text-red-500">*</span></label>
            <textarea className="px-3 py-2 border border-gray-300 rounded-[8px] text-gray-900 bg-white outline-none focus:border-purple-500 transition-all resize-vertical" value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Tell us why you're interested and any specific requirements…"
              rows={4} required />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex gap-3 mt-1">
            <button type="submit" className="btn-glow flex-1" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin inline-block" /> : 'Submit Enquiry →'}
            </button>
            <button type="button" className="btn-glow" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <div className="text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="border border-gray-200 bg-white rounded-[10px] p-2.5">
      <div className="text-[0.72rem] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[0.95rem] text-gray-900 font-semibold">{value}</div>
    </div>
  );
}