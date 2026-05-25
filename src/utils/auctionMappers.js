function unwrapEnvelope(raw) {
  const envelope = raw?.data ?? raw;
  return envelope?.data ?? envelope;
}

/**
 * Parse API datetime strings without corrupting offset suffixes (+00:00).
 * Appending "Z" to "2026-05-26T12:00:00+00:00" breaks Date parsing in browsers.
 */
export function parseAuctionDate(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const direct = new Date(s);
  if (!Number.isNaN(direct.getTime())) return direct;
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const asUtc = new Date(`${s}Z`);
    if (!Number.isNaN(asUtc.getTime())) return asUtc;
  }
  return null;
}

function normalizeEndTime(value) {
  const d = parseAuctionDate(value);
  return d ? d.toISOString() : null;
}

function mapBid(b) {
  if (!b) return null;
  return {
    id: b.id,
    amount: Number(b.amount ?? 0),
    bidderName: b.bidder_name ?? b.bidderName,
    bidTime: normalizeEndTime(b.bid_time ?? b.bidTime),
    winningBid: b.winning_bid ?? b.winningBid ?? b.is_winning_bid,
    isWinningBid: b.is_winning_bid ?? b.isWinningBid ?? b.winning_bid ?? b.winningBid,
  };
}

/** Domain auction detail from GET /api/v1/auction/{id}. */
export function mapDomainAuctionPayload(raw) {
  const envelope = raw?.data ?? raw;
  const a = envelope?.auction ?? envelope;
  if (!a || typeof a !== 'object') {
    return { auction: null, bids: [], minNextBid: 0 };
  }
  const highest = Number(a.current_highest_bid ?? a.currentHighestBid ?? 0);
  const minBid = Number(a.min_bid_price ?? a.minBidPrice ?? 0);
  const base = highest > 0 ? highest : minBid;
  const bids = (a.recent_bids ?? a.bids ?? []).map(mapBid).filter(Boolean);
  return {
    auction: {
      id: a.id,
      status: a.status,
      endTime: normalizeEndTime(a.end_time ?? a.endTime),
      currentHighestBid: highest,
      totalBids: a.total_bids ?? a.totalBids ?? 0,
      currentWinnerName: a.winner?.name ?? a.currentWinnerName,
      currentWinnerId: a.current_winner_id ?? a.currentWinnerId ?? a.winner?.user_id,
      domain: a.domain,
      minBidPrice: minBid,
    },
    bids,
    minNextBid: Math.ceil(base * 1.05),
  };
}

/** Venture auction — nested { auction, bids, venture } API → UI camelCase. */
export function mapVentureAuctionPayload(raw) {
  const envelope = unwrapEnvelope(raw);
  if (!envelope) return { auction: null, bids: [], minNextBid: 0 };

  const a = envelope.auction ?? envelope;
  if (!a?.id) return { auction: null, bids: [], minNextBid: 0 };

  const highest = Number(a.currentHighestBid ?? a.current_highest_bid ?? 0);
  const minBid = Number(a.minBidPrice ?? a.min_bid_price ?? 0);
  const minNext = Number(envelope.minNextBid ?? envelope.min_next_bid ?? 0);
  const base = highest > 0 ? highest : minBid;
  const bidList = (envelope.bids ?? a.bids ?? []).map(mapBid).filter(Boolean);
  const venture = envelope.venture ?? a.venture ?? null;

  const endRaw = a.endTime ?? a.end_time;
  const startRaw = a.startTime ?? a.start_time;
  const endParsed = parseAuctionDate(endRaw);
  const startParsed = parseAuctionDate(startRaw);

  return {
    auction: {
      id: a.id,
      ventureId: a.ventureId ?? a.venture_id,
      status: a.status,
      approvalStatus: a.approvalStatus ?? a.approval_status,
      duration: a.duration,
      minBidPrice: minBid,
      endTime: endParsed ? endParsed.toISOString() : null,
      startTime: startParsed ? startParsed.toISOString() : null,
      currentHighestBid: highest,
      totalBids: a.totalBids ?? a.total_bids ?? envelope.totalBids ?? 0,
      currentWinnerName: a.currentWinnerName ?? a.current_winner_name,
      rejectionReason: a.rejectionReason ?? a.rejection_reason,
      venture,
    },
    bids: bidList,
    minNextBid: minNext > 0 ? minNext : Math.ceil(base * 1.05),
  };
}

/** Community auction from ApiResponse data object. */
export function mapCommunityAuctionPayload(raw) {
  const a = unwrapEnvelope(raw);
  if (!a) return { auction: null, bids: [], minNextBid: 0 };
  const highest = Number(a.current_highest_bid ?? a.currentHighestBid ?? 0);
  const minBid = Number(a.min_bid_price ?? a.minBidPrice ?? 0);
  const base = highest > 0 ? highest : minBid;
  return {
    auction: {
      id: a.id,
      communityId: a.community_id ?? a.communityId,
      status: a.status,
      endTime: normalizeEndTime(a.end_time ?? a.endTime),
      currentHighestBid: highest,
      totalBids: a.total_bids ?? a.totalBids ?? 0,
      auctionTitle: a.auction_title ?? a.auctionTitle,
    },
    bids: [],
    minNextBid: Math.ceil(base * 1.05),
  };
}

/** Normalize WS payloads (type vs event). */
export function normalizeWsMessage(msg) {
  if (!msg || typeof msg !== 'object') return msg;
  if (msg.type) return msg;
  if (msg.event === 'community_auction_bid_placed' && msg.data) {
    const bid = msg.data;
    return {
      type: 'BID_PLACED',
      latestBid: mapBid(bid),
      currentHighestBid: bid.amount,
      totalBids: undefined,
    };
  }
  if (msg.event === 'notification_created') {
    return { type: 'NEW_NOTIFICATION', data: msg.data };
  }
  return msg;
}
