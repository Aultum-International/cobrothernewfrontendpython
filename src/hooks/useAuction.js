import { useState, useEffect, useRef, useCallback } from 'react';
import { auctionAPI } from '../api/services';
import { mapDomainAuctionPayload, normalizeWsMessage } from '../utils/auctionMappers';
import { buildWsUrl } from '../utils/ws';

export function useAuction(auctionId) {
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [minNextBid, setMinNextBid] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const handleUpdateRef = useRef(null);

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
    } else if (normalized.type === 'PAYMENT_COMPLETED') {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              status: normalized.status ?? 'COMPLETED',
            }
          : prev,
      );
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
      setAuction((prev) => (prev ? { ...prev, status: 'ACTIVE' } : prev));
    }
  }, []);

  handleUpdateRef.current = handleUpdate;

  useEffect(() => {
    if (!auctionId) return;
    setLoading(true);
    auctionAPI
      .get(auctionId)
      .then((response) => {
        const mapped = mapDomainAuctionPayload(response);
        setAuction(mapped.auction);
        setBids(mapped.bids);
        setMinNextBid(mapped.minNextBid);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auctionId]);

  useEffect(() => {
    if (!auctionId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const ws = new WebSocket(buildWsUrl(`/ws/auction/${auctionId}`, token));

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        handleUpdateRef.current(JSON.parse(event.data));
      } catch (e) {
        console.error('Failed to parse auction WS message:', e);
      }
    };

    return () => ws.close();
  }, [auctionId]);

  const placeBid = useCallback(
    (amount) => auctionAPI.placeBid(auctionId, amount),
    [auctionId],
  );

  return { auction, bids, minNextBid, connected, loading, lastUpdate, placeBid };
}
