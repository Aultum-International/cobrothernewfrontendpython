import { useState, useEffect, useCallback } from 'react';
import { softwareAuctionAPI } from '../api/services';
import { parseAuctionDate } from '../utils/auctionMappers';

/**
 * Software auctions have no native WebSocket on the backend — poll over HTTP.
 */
export function useSoftwareAuction(auctionId) {
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [minNextBid, setMinNextBid] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(() => {
    if (!auctionId) return Promise.resolve();
    return softwareAuctionAPI
      .get(auctionId)
      .then(({ data }) => {
        const payload = data?.data ?? data;
        const a = payload?.auction ?? payload;
        if (a) {
          const end = parseAuctionDate(a.endTime ?? a.end_time);
          if (end) a.endTime = end.toISOString();
          else if (a.endTime ?? a.end_time) a.endTime = null;
          setAuction(a);
          setBids(payload?.bids ?? a.bids ?? []);
          const highest = Number(a.currentHighestBid ?? a.current_highest_bid ?? 0);
          const min = Number(a.minBidPrice ?? a.min_bid_price ?? 0);
          setMinNextBid(Math.ceil((highest || min) * 1.05));
        }
      })
      .catch(() => {});
  }, [auctionId]);

  useEffect(() => {
    if (!auctionId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [auctionId, load]);

  useEffect(() => {
    if (!auctionId) return;
    const isLive =
      auction?.status === 'ACTIVE' || auction?.status === 'EXTENDED';
    if (!isLive) {
      setConnected(false);
      return undefined;
    }
    setConnected(true);
    const poll = setInterval(() => {
      load().catch(() => {});
    }, 5000);
    return () => {
      clearInterval(poll);
      setConnected(false);
    };
  }, [auctionId, auction?.status, load]);

  const placeBid = useCallback(
    (amount) => softwareAuctionAPI.placeBid(auctionId, amount),
    [auctionId],
  );

  return { auction, bids, minNextBid, connected, loading, lastUpdate, placeBid };
}
