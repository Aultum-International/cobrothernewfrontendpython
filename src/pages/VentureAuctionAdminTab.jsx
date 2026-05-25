import { useState } from 'react';
import { ventureAuctionAPI } from '../api/services';

const APPROVAL_COLORS = {
  AWAITING_GSTIN:   { color: '#6eadc8', bg: 'rgba(110,173,200,0.1)', label: 'Awaiting GSTIN' },
  PENDING_APPROVAL: { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', label: '⏳ Pending Review' },
  APPROVED:         { color: '#6ec896', bg: 'rgba(110,200,150,0.1)', label: '✅ Approved' },
  REJECTED:         { color: '#c86e6e', bg: 'rgba(200,110,110,0.1)', label: '❌ Rejected' },
};

const labelStyle = {
  fontSize: '0.72rem', fontWeight: 600, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem',
};
const valueStyle = { fontSize: '0.9rem', color: '#111827', fontWeight: 500 };

export default function VentureAuctionAdminTab({ auctions, onRefresh }) {
  const [filter, setFilter] = useState('PENDING_APPROVAL');

  const filtered = filter === 'ALL'
    ? auctions
    : auctions.filter((item) => {
        const a = item.auction ?? item;
        return a.approvalStatus === filter;
      });

  const pendingCount = auctions.filter(
    (item) => (item.auction ?? item).approvalStatus === 'PENDING_APPROVAL',
  ).length;

  if (auctions.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">No venture auctions yet</h3>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { id: 'PENDING_APPROVAL', label: `⏳ Pending Review (${pendingCount})` },
          { id: 'AWAITING_GSTIN', label: 'Awaiting GSTIN' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
          { id: 'ALL', label: `All (${auctions.length})` },
        ].map((f) => (
          <button key={f.id} className={`filter-tab ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)} style={{ fontSize: '0.82rem' }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No auctions match this filter.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((item) => {
            const auction = item.auction ?? item;
            const venture = item.venture ?? auction.venture ?? {};
            const brand = venture.brandDetails || {};
            return (
              <VentureAuctionAdminRow
                key={auction.id}
                auction={auction}
                venture={venture}
                brand={brand}
                onRefresh={onRefresh}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function VentureAuctionAdminRow({ auction, venture, brand, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [gstin, setGstin] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const approval = APPROVAL_COLORS[auction.approvalStatus] || APPROVAL_COLORS.AWAITING_GSTIN;
  const isPending = auction.approvalStatus === 'PENDING_APPROVAL';
  const ventureId = venture.id || auction.ventureId;

  const handleApprove = async () => {
    if (!confirm(`Approve auction for "${brand.brandName || 'venture'}"? It will go live immediately.`)) return;
    setLoading(true);
    try {
      await ventureAuctionAPI.adminApprove(auction.id);
      onRefresh?.();
    } catch (e) {
      alert(e.response?.data?.error || e.response?.data?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    try {
      await ventureAuctionAPI.adminReject(auction.id, rejectReason.trim());
      setRejectModal(false);
      setRejectReason('');
      onRefresh?.();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyGstin = async () => {
    setErr(''); setMsg('');
    const trimmed = gstin.trim().toUpperCase();
    if (trimmed.length !== 15) {
      setErr('GSTIN must be 15 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await ventureAuctionAPI.adminVerifyGstin(ventureId, trimmed);
      if (data.verified) {
        setMsg(data.message || 'GSTIN verified — pending approval.');
        onRefresh?.();
      } else {
        setErr(data.error || 'Verification failed.');
      }
    } catch (e) {
      setErr(e.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden',
        borderLeft: isPending ? '4px solid #c8a96e' : '4px solid transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
          onClick={() => setExpanded((v) => !v)}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#111827' }}>
              {brand.brandName || `Venture #${auction.id?.slice(0, 8)}`}
              <span style={{ marginLeft: 8, fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700 }}>🔨 Equity</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>
              Min: ₹{Number(auction.minBidPrice || 0).toLocaleString('en-IN')}
              {' · '}{auction.duration?.replace(/_/g, ' ')}
              {' · '}{auction.totalBids ?? 0} bids
              {venture.gstinVerified && ' · GSTIN ✓'}
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: approval.color, background: approval.bg,
            border: `1px solid ${approval.color}44`, padding: '0.2rem 0.6rem', borderRadius: 4 }}>
            {approval.label}
          </span>
          <span style={{ color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={labelStyle}>Owner</div>
                <div style={valueStyle}>{venture.listedBy?.firstname} {venture.listedBy?.lastname}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{venture.listedBy?.email}</div>
              </div>
              <div>
                <div style={labelStyle}>Auction status</div>
                <div style={valueStyle}>{auction.status}</div>
              </div>
              <div>
                <div style={labelStyle}>Stage</div>
                <div style={valueStyle}>{venture.stage?.replace(/_/g, ' ') || '—'}</div>
              </div>
            </div>

            {auction.approvalStatus === 'AWAITING_GSTIN' && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(110,173,200,0.06)',
                border: '1px solid rgba(110,173,200,0.2)', borderRadius: 8 }}>
                <div style={labelStyle}>Admin: verify GSTIN (sandbox in dev)</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <input type="text" maxLength={15} placeholder="27ABCDE1234F1Z5" value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    style={{ flex: '1 1 200px', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontFamily: 'monospace' }} />
                  <button type="button" disabled={loading} onClick={handleVerifyGstin}
                    style={{ padding: '0.5rem 1rem', background: '#6eadc8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
                    Verify GSTIN
                  </button>
                </div>
                {err && <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: 8 }}>{err}</div>}
                {msg && <div style={{ color: '#059669', fontSize: '0.8rem', marginTop: 8 }}>{msg}</div>}
              </div>
            )}

            {isPending && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-glow" disabled={loading} onClick={handleApprove}>
                  ✅ Approve & Go Live
                </button>
                <button type="button" className="btn-ghost" disabled={loading} onClick={() => setRejectModal(true)}>
                  ❌ Reject
                </button>
              </div>
            )}

            {auction.approvalStatus === 'REJECTED' && auction.rejectionReason && (
              <p style={{ fontSize: '0.85rem', color: '#c86e6e', marginTop: '0.75rem' }}>
                Reason: {auction.rejectionReason}
              </p>
            )}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setRejectModal(false)}>
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: '1rem' }}>Reject venture auction</h3>
            <textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection…" style={{ width: '100%', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn-danger" disabled={loading} onClick={handleReject}>Reject</button>
              <button type="button" className="btn-ghost" onClick={() => setRejectModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
