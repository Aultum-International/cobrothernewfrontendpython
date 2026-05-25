import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVentureAuction } from '../hooks/useVentureAuction';
import { useAuth } from '../context/AuthContext';
import { ventureAuctionAPI } from '../api/services';
import AppLayout from '../components/layout/AppLayout';
import { Gavel, Clock, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { parseAuctionDate } from '../utils/auctionMappers';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { formatInr, clampBidInput } from '../utils/formatInr';

function Countdown({ endTime, status }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (status !== 'ACTIVE' && status !== 'EXTENDED') {
      setTimeLeft('');
      return;
    }
    const end = parseAuctionDate(endTime);
    if (!end) {
      setTimeLeft('');
      return;
    }
    const tick = () => {
      const diff = end.getTime() - Date.now();
      if (!Number.isFinite(diff)) {
        setTimeLeft('');
        return;
      }
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(h > 0
        ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
        : `${m}m ${String(s).padStart(2,'0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime, status]);

  if (!timeLeft) {
    if (status === 'ACTIVE' || status === 'EXTENDED') {
      return (
        <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontWeight: 600, fontSize: '1.1rem' }}>
          —
        </span>
      );
    }
    return null;
  }
  const isUrgent = timeLeft.startsWith('0m') || timeLeft.startsWith('1m') || timeLeft.startsWith('2m');
  return (
    <span style={{ color: isUrgent ? '#c86e6e' : '#6ec896', fontFamily: 'monospace',
                   fontWeight: 700, fontSize: '1.1rem' }}>
      {timeLeft}
    </span>
  );
}

const STATUS_STYLES = {
  ACTIVE:           { color: '#6ec896', bg: 'rgba(110,200,150,0.12)', label: '🟢 Live' },
  EXTENDED:         { color: '#c8a96e', bg: 'rgba(200,169,110,0.12)', label: '⏱ Extended' },
  ENDED:            { color: '#6eadc8', bg: 'rgba(110,173,200,0.12)', label: '✓ Ended' },
  UNSOLD:           { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', label: 'No Bids' },
  CLOSED:           { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: 'Closed' },
  DRAFT:            { color: '#c8a96e', bg: 'rgba(200,169,110,0.12)', label: '⏳ Draft' },
};

const APPROVAL_STYLES = {
  AWAITING_GSTIN:     { color: '#6eadc8', bg: 'rgba(110,173,200,0.12)', label: 'Awaiting GSTIN' },
  PENDING_APPROVAL:   { color: '#c8a96e', bg: 'rgba(200,169,110,0.12)', label: '⏳ Pending Admin Approval' },
  APPROVED:           { color: '#6ec896', bg: 'rgba(110,200,150,0.12)', label: '✓ Approved' },
  REJECTED:           { color: '#c86e6e', bg: 'rgba(200,110,110,0.12)', label: '❌ Rejected' },
};

export default function VentureAuctionPage() {
  const { auctionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { auction, bids, minNextBid, connected, loading, placeBid, reload } = useVentureAuction(auctionId);

  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [placing, setPlacing] = useState(false);
  const [config, setConfig] = useState({
    participationFeeInr: 118,
    maxBidInr: 50_000_000,
    minBidIncrementPercent: 5,
  });
  const [participationPaid, setParticipationPaid] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const maxBid = Number(config.maxBidInr) || 50_000_000;
  const participationFee = Number(config.participationFeeInr) || 118;

  const loadParticipation = useCallback(() => {
    if (!auctionId || !user) return;
    ventureAuctionAPI.participationStatus(auctionId)
      .then(({ data }) => {
        const body = data?.data ?? data;
        setParticipationPaid(!!body.paid);
      })
      .catch(() => setParticipationPaid(false));
  }, [auctionId, user]);

  useEffect(() => {
    ventureAuctionAPI.getConfig()
      .then(({ data }) => {
        const body = data?.data ?? data;
        if (body) setConfig(body);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadParticipation();
  }, [loadParticipation]);

  const handlePayParticipation = async () => {
    setPayLoading(true);
    setPayError('');
    try {
      const { data } = await ventureAuctionAPI.participationCreateOrder(auctionId);
      openRazorpayCheckout({
        orderData: data,
        user,
        description: 'Venture auction participation fee',
        themeColor: '#7c3aed',
        onSuccess: async (response) => {
          try {
            await ventureAuctionAPI.participationVerify(auctionId, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setParticipationPaid(true);
            setPayError('');
          } catch {
            setPayError('Payment verification failed. Contact support if amount was deducted.');
          } finally {
            setPayLoading(false);
          }
        },
        onFailure: () => {
          setPayError('Payment failed. Please try again.');
          setPayLoading(false);
        },
        onDismiss: () => setPayLoading(false),
      });
    } catch (e) {
      setPayError(e.response?.data?.error || e.response?.data?.message || 'Could not start payment.');
      setPayLoading(false);
    }
  };

  const venture = auction?.venture || {};
  const brand = venture.brandDetails || {};
  const isApproved = auction?.approvalStatus === 'APPROVED';
  const isPendingApproval = auction?.approvalStatus === 'PENDING_APPROVAL';
  const isAwaitingGstin = auction?.approvalStatus === 'AWAITING_GSTIN';
  const isRejected = auction?.approvalStatus === 'REJECTED';
  const isActive = isApproved && (auction?.status === 'ACTIVE' || auction?.status === 'EXTENDED');
  const isOwner = user && venture?.listedBy?.id === user.id;
  const statusStyle = STATUS_STYLES[auction?.status] || STATUS_STYLES.DRAFT;
  const approvalStyle = APPROVAL_STYLES[auction?.approvalStatus] || APPROVAL_STYLES.AWAITING_GSTIN;

  const handleBid = async () => {
    const check = clampBidInput(bidAmount, minNextBid, maxBid);
    if (!check.valid) {
      setBidError(check.error || 'Enter a valid amount');
      return;
    }
    setBidError('');
    setBidSuccess('');
    setPlacing(true);
    try {
      await placeBid(check.value);
      setBidSuccess('Bid placed successfully!');
      setBidAmount('');
      reload?.();
      setTimeout(() => setBidSuccess(''), 4000);
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.message || 'Failed to place bid';
      setBidError(msg);
      if (e.response?.status === 402) loadParticipation();
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!auction) return (
    <AppLayout>
      <div className="text-center py-24">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Auction not found</h2>
        <button className="btn-ghost mt-4" onClick={() => navigate('/ventures')}>← Back to Ventures</button>
      </div>
    </AppLayout>
  );

  const minBid = Number(auction.minBidPrice) || 0;

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem' }}>

        <button className="btn-ghost mb-4" style={{ fontSize: '0.85rem' }}
          onClick={() => navigate('/ventures')}>
          ← Ventures
        </button>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb',
                      borderRadius: 14, padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem',
                           fontWeight: 700, color: '#111827', margin: 0 }}>
                {brand.brandName || 'Venture Auction'}
              </h1>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a06ec8',
                               background: 'rgba(160,110,200,0.1)',
                               border: '1px solid rgba(160,110,200,0.25)',
                               padding: '0.2rem 0.6rem', borderRadius: 4 }}>
                  🔨 Equity Auction
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700,
                               background: approvalStyle.bg, color: approvalStyle.color,
                               border: `1px solid ${approvalStyle.color}44`,
                               padding: '0.2rem 0.6rem', borderRadius: 4 }}>
                  {approvalStyle.label}
                </span>
                {isApproved && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700,
                                 background: statusStyle.bg, color: statusStyle.color,
                                 border: `1px solid ${statusStyle.color}44`,
                                 padding: '0.2rem 0.6rem', borderRadius: 4 }}>
                    {statusStyle.label}
                  </span>
                )}
                {venture.verified && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669',
                                 background: 'rgba(5,150,105,0.08)',
                                 border: '1px solid rgba(5,150,105,0.25)',
                                 padding: '0.2rem 0.6rem', borderRadius: 4 }}>
                    ✓ GSTIN
                  </span>
                )}
                {!connected && isActive && (
                  <span style={{ fontSize: '0.72rem', color: '#c86e6e', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <WifiOff size={11} /> Reconnecting…
                  </span>
                )}
                {connected && isActive && (
                  <span style={{ fontSize: '0.72rem', color: '#6ec896', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wifi size={11} /> Live
                  </span>
                )}
              </div>
              {(brand.industry || venture.stage) && (
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.35rem' }}>
                  {brand.industry?.replace(/_/g, ' ')}
                  {venture.stage && ` · ${venture.stage.replace(/_/g, ' ')}`}
                </div>
              )}
            </div>

            {isActive && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase',
                              letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                  <Clock size={11} style={{ marginRight: 4 }} />Time Left
                </div>
                <Countdown endTime={auction.endTime} status={auction.status} />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                        gap: '1rem', marginTop: '1.25rem', padding: '1rem',
                        background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Min Bid</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 700, color: '#111827' }}>
                {formatInr(minBid, { max: maxBid })}
              </div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Current Highest</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 700,
                            color: auction.currentHighestBid > 0 ? '#6ec896' : '#9ca3af' }}>
                {auction.currentHighestBid > 0
                  ? formatInr(auction.currentHighestBid, { max: maxBid })
                  : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Total Bids</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 700, color: '#111827' }}>
                {auction.totalBids ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {brand.description && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem' }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 700,
                             color: '#111827', margin: '0 0 0.75rem' }}>About the Venture</h3>
                <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                  {brand.description}
                </p>
              </div>
            )}

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 700,
                           color: '#111827', margin: '0 0 0.75rem' }}>
                <TrendingUp size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Bid History ({bids.length})
              </h3>
              {bids.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>No bids yet. Be the first!</p>
              ) : (
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {bids.map((bid, i) => (
                    <div key={bid.id || i} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '0.5rem 0', borderBottom: i < bids.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                        {bid.bidderName}
                        {bid.isWinningBid && (
                          <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#059669' }}>🏆</span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6eadc8' }}>
                        {formatInr(bid.amount, { max: maxBid })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
            {isAwaitingGstin && (
              <Panel title="GSTIN required" icon="🔍">
                Complete GSTIN verification from your venture dashboard before admin review.
                {isOwner && (
                  <button className="btn-glow w-full mt-4" onClick={() => navigate('/ventures/dashboard')}>
                    Go to Dashboard →
                  </button>
                )}
              </Panel>
            )}

            {isPendingApproval && (
              <Panel title="Awaiting admin approval" icon="⏳">
                GSTIN is verified. Our team will approve your auction before it appears on Live Auctions.
              </Panel>
            )}

            {isRejected && (
              <Panel title="Auction rejected" icon="❌">
                {auction.rejectionReason || 'Contact support for details.'}
              </Panel>
            )}

            {isActive && !isOwner && user && !participationPaid && (
              <Panel title="Pay to participate" icon="💳">
                Pay {formatInr(participationFee)} once to unlock bidding on this auction.
                <button type="button" className="btn-glow w-full mt-4" disabled={payLoading}
                  onClick={handlePayParticipation}>
                  {payLoading ? 'Opening payment…' : `Pay ${formatInr(participationFee)} & bid`}
                </button>
                {payError && <p className="text-sm text-red-600 mt-2">{payError}</p>}
              </Panel>
            )}

            {isActive && !isOwner && user && participationPaid && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                  <Gavel size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Place a Bid
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0 0 0.5rem' }}>
                  Min: {formatInr(minNextBid)} ({config.minBidIncrementPercent || 5}% above highest)
                </p>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0 0 1rem' }}>
                  Max: {formatInr(maxBid)}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>₹</span>
                    <input
                      type="number"
                      value={bidAmount}
                      min={minNextBid}
                      max={maxBid}
                      step="1"
                      onChange={e => { setBidAmount(e.target.value); setBidError(''); }}
                      placeholder={String(Math.ceil(minNextBid))}
                      style={{ paddingLeft: '1.75rem', width: '100%' }}
                    />
                  </div>
                  <button className="btn-glow" onClick={handleBid} disabled={placing} style={{ minWidth: 80 }}>
                    {placing ? <span className="btn-spinner" /> : 'Bid →'}
                  </button>
                </div>
                {bidError && <div style={{ fontSize: '0.8rem', color: '#c86e6e', marginBottom: 8 }}>⚠ {bidError}</div>}
                {bidSuccess && <div style={{ fontSize: '0.8rem', color: '#6ec896', marginBottom: 8 }}>✓ {bidSuccess}</div>}
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>
                  ✓ Participation fee paid
                </p>
              </div>
            )}

            {isActive && isOwner && (
              <Panel title="Your auction" icon="👑">
                You cannot bid on your own venture. Monitor bids here in real time.
              </Panel>
            )}

            {!user && isActive && (
              <Panel title="Sign in to bid" icon="🔐">
                <button className="btn-glow w-full mt-2" onClick={() => navigate('/login')}>Sign In</button>
              </Panel>
            )}

            {venture.listedBy && (
              <div style={{ marginTop: '1rem', background: '#fff', border: '1px solid #e5e7eb',
                            borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Listed by</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                  {venture.listedBy.firstname} {venture.listedBy.lastname}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>{children}</p>
    </div>
  );
}
