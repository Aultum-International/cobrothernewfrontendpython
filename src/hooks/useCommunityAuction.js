import { useState, useEffect, useRef, useCallback } from 'react';
import { communityAuctionAPI } from '../api/services';
import { mapCommunityAuctionPayload, normalizeWsMessage } from '../utils/auctionMappers';
import { buildWsUrl } from '../utils/ws';
import { unwrapApiData } from '../api/unwrap';

export function useCommunityAuction(auctionId) {
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
              totalBids: (prev.totalBids ?? 0) + 1,
            }
          : prev,
      );
      if (normalized.currentHighestBid) {
        setMinNextBid(Math.ceil(Number(normalized.currentHighestBid) * 1.05));
      }
      if (normalized.latestBid) {
        setBids((prev) => [normalized.latestBid, ...prev]);
      }
    }
  }, []);

  handleUpdateRef.current = handleUpdate;

  useEffect(() => {
    if (!auctionId) return;
    setLoading(true);
    communityAuctionAPI
      .get(auctionId)
      .then((response) => {
        const mapped = mapCommunityAuctionPayload(response);
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

    const ws = new WebSocket(buildWsUrl(`/ws/community-auction/${auctionId}`, token));

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        handleUpdateRef.current(JSON.parse(event.data));
      } catch (e) {
        console.error('Failed to parse community auction WS message:', e);
      }
    };

    return () => ws.close();
  }, [auctionId]);

  const placeBid = useCallback(
    async (amount) => {
      const response = await communityAuctionAPI.placeBid(auctionId, amount);
      const bid = unwrapApiData(response);
      if (bid) {
        setBids((prev) => [bid, ...prev]);
      }
      return response;
    },
    [auctionId],
  );

  return { auction, bids, minNextBid, connected, loading, lastUpdate, placeBid };
}
