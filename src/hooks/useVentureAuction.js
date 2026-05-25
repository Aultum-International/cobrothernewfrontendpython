import { useState, useEffect, useRef, useCallback } from 'react';
import { ventureAuctionAPI } from '../api/services';
import { mapVentureAuctionPayload, normalizeWsMessage } from '../utils/auctionMappers';
import { buildWsUrl } from '../utils/ws';

export function useVentureAuction(auctionId) {
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [minNextBid, setMinNextBid] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const handleUpdateRef = useRef(null);

  const load = useCallback(() => {
    if (!auctionId) return Promise.resolve();
    return ventureAuctionAPI
      .get(auctionId)
      .then(({ data }) => {
        const mapped = mapVentureAuctionPayload(data);
        if (mapped.auction) {
          setAuction(mapped.auction);
          setBids(mapped.bids);
          setMinNextBid(mapped.minNextBid);
        }
      })
      .catch(() => {});
  }, [auctionId]);

  const handleUpdate = useCallback((msg) => {
    const normalized = normalizeWsMessage(msg);
    setLastUpdate(normalized);

    if (normalized.type === 'BID_PLACED') {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentHighestBid: normalized.currentHighestBid ?? prev.currentHighestBid,
              totalBids: normalized.totalBids ?? prev.totalBids + 1,
              endTime: normalized.endTime
                ? normalized.endTime.endsWith('Z')
                  ? normalized.endTime
                  : `${normalized.endTime}Z`
                : prev.endTime,
              status: normalized.status ?? prev.status,
              currentWinnerName: normalized.currentWinnerName ?? prev.currentWinnerName,
            }
          : prev,
      );
      if (normalized.currentHighestBid) {
        setMinNextBid(Math.ceil(Number(normalized.currentHighestBid) * 1.05));
      }
      if (normalized.latestBid) {
        setBids((prev) => [normalized.latestBid, ...prev]);
      }
    } else if (normalized.type === 'AUCTION_ENDED' || normalized.type === 'AUCTION_UNSOLD') {
      setAuction((prev) => (prev ? { ...prev, status: normalized.status } : prev));
    } else if (normalized.type === 'AUCTION_EXTENDED' && normalized.endTime) {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              endTime: normalized.endTime.endsWith('Z') ? normalized.endTime : `${normalized.endTime}Z`,
              status: normalized.status ?? prev.status,
            }
          : prev,
      );
    } else if (normalized.type === 'AUCTION_STARTED') {
      setAuction((prev) => (prev ? { ...prev, status: 'ACTIVE', approvalStatus: 'APPROVED' } : prev));
    }
  }, []);

  handleUpdateRef.current = handleUpdate;

  useEffect(() => {
    if (!auctionId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [auctionId, load]);

  const isLive =
    auction?.approvalStatus === 'APPROVED' &&
    (auction?.status === 'ACTIVE' || auction?.status === 'EXTENDED');

  useEffect(() => {
    if (!auctionId || !isLive) {
      setConnected(false);
      return undefined;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setConnected(false);
      return undefined;
    }

    const ws = new WebSocket(buildWsUrl(`/ws/venture-auction/${auctionId}`, token));

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        handleUpdateRef.current(JSON.parse(event.data));
      } catch (e) {
        console.error('Failed to parse venture auction WS message:', e);
      }
    };

    return () => ws.close();
  }, [auctionId, isLive]);

  const placeBid = useCallback(
    (amount) => ventureAuctionAPI.placeBid(auctionId, amount),
    [auctionId],
  );

  return { auction, bids, minNextBid, connected, loading, lastUpdate, placeBid, reload: load };
}
