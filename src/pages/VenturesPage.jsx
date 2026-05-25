import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ventureAPI, ventureAuctionAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import AppLayout from '../components/layout/AppLayout';
import CoVentureModal from '../components/venture/CoVentureModal';
import { useLikes } from '../hooks/useLikes';
import LikeButton from '../components/common/LikeButton';
import { useFilterSort } from '../hooks/useFilterSort';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import SkeletonCard from '../components/common/Skeleton';
import ConfirmDialog from '../components/common/ConfirmDialog';
import DashboardIcon from '../assets/Dashboard.png';
import VentureLogo from '../assets/Coventure_logo.png';
import { APP_BASE_URL } from '../config/urls';
import { attachVentureAuctions, mapVentureForUi, mapVenturesForUi } from '../utils/venturePayload';

const TYPE_LABELS = {
  FIFTY_FIFTY: '50:50', SIXTY_FORTY: '60:40', SEVENTY_THIRTY: '70:30',
  EIGHTY_TWENTY: '80:20', NINETY_TEN: '90:10', NEGOTIABLE: 'Negotiable',
};

const VENTURE_INDUSTRIES = [
  'TECH','FINANCE','HEALTHCARE','EDUCATION','FOOD_AND_BEVERAGE',
  'RETAIL','REAL_ESTATE','MEDIA','MANUFACTURING','LOGISTICS',
  'AGRICULTURE','OTHER'
].map(v => ({ value: v, label: v.replace(/_/g, ' ') }));

export default function VenturesPage() {
  const { t } = useTranslation();
  const { user }  = useAuth();
  const { currency, getSymbol } = useCurrency();
  const navigate  = useNavigate();

  const [allVentures, setAllVentures]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [applyTarget, setApplyTarget]       = useState(null);
  const [detailTarget, setDetailTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [filterTab, setFilterTab]           = useState('all');

  const { toggle: toggleLike, get: getLike } = useLikes('VENTURE', allVentures);

  // ── Filter / sort / paginate ───────────────────────────────────────────────
  const {
    paginated, totalCount,
    search, category, minPrice, maxPrice, sortBy,
    handleSearch, handleCategory, handleMinPrice, handleMaxPrice, handleSort,
    clearAll, activeFilterCount,
    page, totalPages, setPage,
  } = useFilterSort(
    filterTab === 'mine'
      ? allVentures.filter(v => v.listedBy?.id === user?.id)
      : allVentures,
    {
      searchFields:  ['brandDetails.brandName', 'brandDetails.description'],
      priceField:    'brandDetails.dealValue',
      categoryField: 'brandDetails.industry',
      dateField:     'createdAt',
    },
    20
  );

  useEffect(() => {
    setLoading(true);
    ventureAPI.getAll()
      .then(({ data }) => mapVenturesForUi(data))
      .then((mapped) => attachVentureAuctions(mapped, ventureAuctionAPI))
      .then(setAllVentures)
      .catch(() => setAllVentures([]))
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch when switching to 'mine' tab
  useEffect(() => {
    if (filterTab !== 'mine') return;
    setLoading(true);
    ventureAPI.getMyVentures()
      .then(({ data }) => mapVenturesForUi(data))
      .then((mapped) => attachVentureAuctions(mapped, ventureAuctionAPI))
      .then(setAllVentures)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterTab]);

  const handleDelete = async () => {
    try {
      await ventureAPI.delete(deleteTarget);
      setAllVentures(v => v.filter(x => x.id !== deleteTarget));
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const refreshVentures = () => {
    const req = filterTab === 'mine' ? ventureAPI.getMyVentures() : ventureAPI.getAll();
    req
      .then(({ data }) => mapVenturesForUi(data))
      .then((mapped) => attachVentureAuctions(mapped, ventureAuctionAPI))
      .then(setAllVentures);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between min-w-0">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 m-0">{t('venture')}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Discover and co-venture on exciting opportunities.</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto lg:justify-end shrink-0">
            <button
              type="button"
              className="btn-glow btn-glow-sm flex items-center justify-center gap-2 text-sm py-2.5 px-4 min-h-[44px] flex-1 sm:flex-none"
              onClick={() => navigate('/ventures/dashboard')}
            >
              <img src={DashboardIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
              <span>{t('dashboard')}</span>
            </button>
            <button
              type="button"
              className="btn-glow btn-glow-sm flex items-center justify-center gap-2 text-sm py-2.5 px-4 min-h-[44px] flex-1 sm:flex-none"
              onClick={() => navigate('/ventures/analytics')}
            >
              <span aria-hidden>📈</span>
              <span>Analytics</span>
            </button>
            <Link
              to="/ventures/new"
              className="btn-glow btn-glow-sm flex items-center justify-center gap-2 text-sm py-2.5 px-4 min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
            >
              + List Venture
            </Link>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            className={`btn-glow btn-glow-sm text-sm py-2.5 px-4 min-h-[44px] ${filterTab === 'all' ? 'bg-gray-900 text-white border-gray-900' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Ventures
          </button>
          <button
            type="button"
            className={`btn-glow btn-glow-sm text-sm py-2.5 px-4 min-h-[44px] ${filterTab === 'mine' ? 'bg-gray-900 text-white border-gray-900' : ''}`}
            onClick={() => setFilterTab('mine')}
          >
            My Ventures
          </button>
        </div>

        {/* ── Filter bar ── */}
        <FilterBar
          search={search}           onSearch={handleSearch}
          category={category}       onCategory={handleCategory}
          categoryOptions={VENTURE_INDUSTRIES}
          minPrice={minPrice}       onMinPrice={handleMinPrice}
          maxPrice={maxPrice}       onMaxPrice={handleMaxPrice}
          sortBy={sortBy}           onSort={handleSort}
          onClear={clearAll}        activeFilterCount={activeFilterCount}
          placeholder="Search ventures by name or description…"
          priceSymbol={getSymbol(currency)}
          theme="light"
        />

        {/* ── Result count ── */}
        {!loading && totalCount > 0 && (
          <div className="text-sm text-gray-600 mb-4">
            {totalCount} venture{totalCount !== 1 ? 's' : ''} found
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4 flex justify-center">
              <img src={VentureLogo} alt="Ventures" className="w-16 h-16 opacity-50" />
            </div>
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
              {activeFilterCount > 0 ? 'No ventures match your filters' :
               filterTab === 'mine' ? "You haven't listed any ventures yet" :
               'No ventures listed yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeFilterCount > 0
                ? 'Try adjusting your search or filters.'
                : 'Be the first to list a venture and attract co-venturers.'}
            </p>
            {activeFilterCount > 0
              ? <button className="btn-glow btn-glow-sm" onClick={clearAll}>Clear Filters</button>
              : <Link to="/ventures/new" className="btn-glow btn-glow-sm">+ List Venture</Link>
            }
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {paginated.map(v => (
                <VentureCard
                  key={v.id}
                  venture={v}
                  isOwner={v.listedBy?.id === user?.id}
                  likeState={getLike(v.id)}
                  onLike={() => toggleLike(v.id)}
                  onView={() => setDetailTarget(v)}
                  onApply={() => setApplyTarget(v)}
                  onEdit={() => navigate(`/ventures/${v.id}/edit`)}
                  onDelete={() => setDeleteTarget(v.id)}
                />
              ))}
            </div>
            <Pagination
              page={page} totalPages={totalPages}
              onPage={setPage} totalCount={totalCount} pageSize={20}
            />
          </>
        )}

      {/* ── Modals ── */}
      {detailTarget && (
        <VentureDetailModal
          venture={detailTarget}
          isOwner={detailTarget.listedBy?.id === user?.id}
          onClose={() => { setDetailTarget(null); refreshVentures(); }}
          onApply={() => { setApplyTarget(detailTarget); setDetailTarget(null); }}
          onEdit={() => { navigate(`/ventures/${detailTarget.id}/edit`); setDetailTarget(null); }}
          onDelete={() => { setDeleteTarget(detailTarget.id); setDetailTarget(null); }}
        />
      )}

      {applyTarget && (
        <CoVentureModal venture={applyTarget} onClose={() => setApplyTarget(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Venture?"
        message="This will permanently delete the venture and all associated applications. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}

// ─── Venture Card ─────────────────────────────────────────────────────────────
function VentureCard({ venture, isOwner, onView, onApply, onEdit, onDelete,
                        likeState, onLike }) {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const shareRef = useRef(null);
  const optionsRef = useRef(null);
  const b = venture.brandDetails || {};
  const shortDesc = `${b.description?.slice(0, 130) || ''}${b.description?.length > 130 ? '…' : ''}`;
  const isAuction = venture.saleType === 'AUCTION';
  const auction   = venture.auction;
  const auctionLive = auction?.status === 'ACTIVE' || auction?.status === 'EXTENDED';
  const auctionDraft = isAuction && auction?.status === 'DRAFT';
  const displayMinBid = auction?.minBidPrice ?? venture.auctionMinBidPrice ?? 0;

  // Close share and options dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
// Share URL when `window` is undefined (SSR); browser uses `window.location.origin`.
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/ventures`
      : `${APP_BASE_URL.replace(/\/$/, '')}/ventures`;
  const shareText = `Check out this venture: ${b.brandName} - Listed on CoBrother!`;

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
        {b.ventureImageUrl
          ? <img src={b.ventureImageUrl} alt={b.brandName}
              className="absolute top-0 right-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
          : null
        }
        <div className="relative z-10 flex items-end justify-between w-full">
          <div className="flex items-center gap-2">
            {b.ventureImageUrl
              ? <img src={b.ventureImageUrl} alt={b.brandName}
                  className="w-14 h-14 rounded-xl object-cover ring-[3px] ring-white/50 shadow-lg" />
              : <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display text-2xl font-extrabold text-white ring-[3px] ring-white/30 shadow-lg bg-white/15 backdrop-blur-sm`}>
                  {b.brandName?.[0] || '?'}
                </div>
            }
            <div className="flex flex-wrap items-center gap-1">
              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${isAuction ? 'bg-yellow-400 text-gray-900' : 'bg-white/25 backdrop-blur-sm text-white'}`}>
                {isAuction ? '🔨 Auction' : '🤝 Regular'}
              </span>
              {isOwner && (
                <span className="px-1.5 py-0.5 bg-white text-indigo-600 text-[9px] font-extrabold rounded uppercase tracking-wide shadow-sm">
                  ✦ Owner
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative px-4 pb-4 pt-3 flex flex-col flex-1">
        {/* Brand name + tags row */}
        <div className="flex flex-col gap-1 mb-1">
          <h3 className="font-display text-sm font-extrabold text-gray-900 leading-snug break-words">
            {b.brandName}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {b.industry && (
              <span className="px-1.5 py-[2px] bg-gray-100 text-gray-500 text-[9px] font-bold rounded uppercase tracking-wide whitespace-nowrap">
                {b.industry.replace(/_/g, ' ')}
              </span>
            )}
            {b.ventureType && (
              <span className="px-1.5 py-[2px] bg-indigo-50 text-indigo-500 text-[9px] font-bold rounded uppercase tracking-wide whitespace-nowrap">
                {TYPE_LABELS[b.ventureType] || b.ventureType}
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {shortDesc || <span className="italic text-gray-300">No description yet</span>}
        </p>

        {/* Price block */}
        {isAuction ? (
          <div className={`rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 px-2 md:px-3 py-1.5 md:py-2 mb-2 md:mb-3`}>
            <div className="flex items-baseline gap-1">
              <span className="text-lg md:text-xl font-extrabold text-purple-700 tracking-tight">
                {formatPrice(auction?.currentHighestBid > 0 ? auction.currentHighestBid : displayMinBid)}
              </span>
              <span className="text-[9px] md:text-[10px] text-purple-400 font-semibold">
                {auction.currentHighestBid > 0 ? 'highest' : 'min bid'}
              </span>
            </div>
            <span className="text-[9px] md:text-[10px] text-purple-400">
              {auctionDraft ? '⏳ Verify GSTIN to go live' : `${auction?.totalBids ?? 0} bid${(auction?.totalBids ?? 0) !== 1 ? 's' : ''}`}
            </span>
          </div>
        ) : b.dealValue ? (
          <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-2 md:px-3 py-1.5 md:py-2 mb-2 md:mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg md:text-xl font-extrabold text-emerald-700 tracking-tight">
                {formatPrice(b.dealValue)}
              </span>
              <span className="text-[9px] md:text-[10px] text-emerald-400 font-semibold">deal value</span>
            </div>
          </div>
        ) : null}

        {/* Stats row */}
        <div className="flex items-center gap-1.5 md:gap-2.5 text-[10px] md:text-[11px] text-gray-400 font-medium py-1.5 md:py-2 border-t border-gray-100 mt-auto">
          <span className="flex items-center gap-0.5 md:gap-1">👁 {venture.views || 0}</span>
          {!isAuction && (
            <span className="flex items-center gap-0.5 md:gap-1">📋 {venture.coVentureApplicationCount || 0}</span>
          )}
          <LikeButton liked={likeState?.liked} count={likeState?.count} onToggle={onLike} />

          <div className="relative ml-auto" ref={shareRef}>
            <button
              className="p-0.5 md:p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              onClick={(e) => { e.stopPropagation(); setShareOpen(!shareOpen); }}
              title="Share"
            >
              <Share2 size={11} className="md:w-[13px] md:h-[13px]" />
            </button>

            {shareOpen && (
              <div className="absolute right-0 bottom-full mb-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[150px]">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-[10px] font-semibold text-gray-500">Share via</span>
                </div>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleShare(linkedinShare); }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleShare(facebookShare); }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleShare(whatsappShare); }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
          {/* Website Link */}
          <a href={b.website || '#'} target="_blank" rel="noreferrer"
             className="flex-1 py-1.5 bg-gray-100 text-gray-800 text-[10px] font-bold rounded transition-all hover:bg-gray-200 hover:text-black flex items-center justify-center gap-1"
             onClick={e => !b.website && e.preventDefault()}>
            Website ↗
          </a>

          {/* Options Dropdown for Owner */}
          {isOwner ? (
            <>
              {isAuction && auctionDraft && (
                <button
                  type="button"
                  className="flex-1 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold rounded"
                  onClick={(e) => { e.stopPropagation(); navigate('/ventures/dashboard'); }}
                >
                  Verify GSTIN →
                </button>
              )}
            <div className="relative flex-1" ref={optionsRef}>
              <button
                className="w-full py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded transition-all hover:bg-gray-800 flex items-center justify-center gap-1"
                onClick={(e) => { e.stopPropagation(); setOptionsOpen(!optionsOpen); }}>
                Options ▼
              </button>
              {optionsOpen && (
                <div className="absolute right-0 bottom-full mb-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[100px]">
                  <button className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left" onClick={(e) => { e.stopPropagation(); setOptionsOpen(false); onView(); }}>View</button>
                  <button className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left" onClick={(e) => { e.stopPropagation(); setOptionsOpen(false); onEdit(); }}>Edit</button>
                  <button className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left" onClick={(e) => { e.stopPropagation(); setOptionsOpen(false); onDelete(); }}>Delete</button>
                </div>
              )}
            </div>
            </>
          ) : (
            /* Apply/Bid for non-owner */
            <>
              {isAuction && auctionLive && auction?.id ? (
                <button className={`flex-1 py-1.5 bg-gradient-to-r ${accentGrad} text-white text-[10px] font-bold rounded transition-all hover:opacity-90`}
                  onClick={() => navigate(`/venture-auction/${auction.id}`)}>🔨 Bid</button>
              ) : !isAuction ? (
                <button className={`flex-1 py-1.5 bg-gradient-to-r ${accentGrad} text-white text-[10px] font-bold rounded transition-all hover:opacity-90`}
                  onClick={onApply}>Apply</button>
              ) : (
                <button className="flex-1 py-1.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded"
                  onClick={onView}>View</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Venture Detail Modal ─────────────────────────────────────────────────────
function VentureDetailModal({ venture, isOwner, onClose, onApply, onEdit, onDelete }) {
  const { formatPrice } = useCurrency();
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched            = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    ventureAPI.get(venture.id)
      .then(({ data }) => setDetail(mapVentureForUi(data?.data ?? data)))
      .catch(() => setDetail(venture))
      .finally(() => setLoading(false));
  }, [venture.id]);

  const b = (detail || venture)?.brandDetails || {};
  const c = (detail || venture)?.contactInfo  || {};

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[620px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white border border-gray-200 rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-slideUp">
        <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full bg-purple-100/30 blur-3xl pointer-events-none" />
        <button className="absolute top-4 right-4 z-20 bg-transparent border-none text-gray-400 text-xl cursor-pointer transition-colors duration-200 hover:text-gray-700" onClick={onClose}>✕</button>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative z-10 p-8 pb-6">
              <div className="flex items-center gap-4 mb-6">
                {b.ventureImageUrl
                  ? <img src={b.ventureImageUrl} alt={b.brandName}
                         className="w-14 h-14 rounded-xl object-cover" />
                  : <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-display text-2xl font-bold text-indigo-600">
                      {b.brandName?.[0] || '?'}
                    </div>
                }
                <div>
                  <h2 className="font-display text-[1.75rem] font-semibold text-gray-900 m-0">{b.brandName}</h2>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {b.industry && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded">{b.industry.replace(/_/g, ' ')}</span>
                    )}
                    {b.ventureType && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded">
                        {TYPE_LABELS[b.ventureType] || b.ventureType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-6 flex-wrap">
                {b.dealValue && (
                  <div className="px-4 py-2 bg-green-50 border border-green-300 rounded-lg text-sm text-green-700">
                    💰 {formatPrice(b.dealValue)}
                  </div>
                )}
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  👁 {(detail?.views ?? venture.views) || 0} views
                </div>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  📋 {(detail?.coVentureApplicationCount ??
                       venture.coVentureApplicationCount) || 0} applications
                </div>
              </div>
            </div>

            <div className="relative z-10 px-8">
              {b.description && (
                <Section title="About">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {b.description}
                  </p>
                </Section>
              )}

              {(c.email || c.phoneNumber) && (
                <Section title="Contact">
                  <div className="grid grid-cols-2 gap-3">
                    {c.email       && <DetailItem label="Email" value={c.email} />}
                    {c.phoneNumber && <DetailItem label="Phone" value={c.phoneNumber} />}
                  </div>
                </Section>
              )}

              {(b.website || b.videoUrl) && (
                <Section title="Links">
                  <div className="flex gap-3 flex-wrap">
                    {b.website && (
                      <a href={b.website} target="_blank" rel="noreferrer"
                         className="btn-glow btn-glow-sm">🌐 Website ↗</a>
                    )}
                    {b.videoUrl && (
                      <a href={b.videoUrl} target="_blank" rel="noreferrer"
                         className="btn-glow btn-glow-sm">🎬 Video ↗</a>
                    )}
                  </div>
                </Section>
              )}

              {(detail || venture).stage && (
                <Section title="Current Stage">
                  <span className="inline-block px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-600">
                    {{ IDEA: '💡 Idea', MVP: '🛠 MVP',
                       REVENUE_GENERATING: '💰 Revenue Generating',
                       SCALING: '🚀 Scaling' }[(detail || venture).stage]}
                  </span>
                </Section>
              )}

              {(detail || venture).lookingFor && (
                <Section title="Looking For">
                  <p className="text-gray-700 leading-relaxed text-sm m-0">
                    {(detail || venture).lookingFor}
                  </p>
                </Section>
              )}

              {(detail || venture).currentProblem && (
                <Section title="Current Challenge">
                  <p className="text-gray-700 leading-relaxed text-sm m-0">
                    {(detail || venture).currentProblem}
                  </p>
                </Section>
              )}

              {detail?.listedBy && (
                <Section title="Listed By">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600 text-sm">
                      {detail.listedBy.firstname?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {detail.listedBy.firstname} {detail.listedBy.lastname}
                      </div>
                      <div className="text-xs text-gray-600">
                        {detail.listedBy.email}
                      </div>
                    </div>
                  </div>
                </Section>
              )}
            </div>

            {/* Actions */}
            <div className="relative z-10 px-8 pb-8 flex gap-3 flex-wrap">
              {isOwner ? (
                <>
                  <button className="btn-glow btn-glow-sm" onClick={onEdit}>✏ Edit</button>
                  <button className="px-5 py-2 bg-red-500 border border-red-500 text-white rounded-[10px] text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-red-600" onClick={onDelete}>Delete</button>
                </>
              ) : (
                <button className="btn-glow btn-glow-sm" onClick={onApply}>Co-Venture →</button>
              )}
              <button className="px-5 py-2 bg-white border-2 border-gray-300 text-gray-600 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gray-50" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}
