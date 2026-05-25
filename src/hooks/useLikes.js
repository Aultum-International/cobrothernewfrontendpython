import { useState, useEffect, useCallback } from 'react';
import { likeAPI } from '../api/services';
import { asArray } from '../utils/asArray';

/**
 * Manages like state for a list of items.
 * type: 'VENTURE' | 'DOMAIN' | 'SOFTWARE' | 'COMMUNITY'
 * items: array with .id fields
 */
export function useLikes(type, items) {
  const list = asArray(items);
  // Map of entityId -> { liked, count }
  const [likeMap, setLikeMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!list.length) return;
    const ids = list.map(i => i.id).filter(Boolean);
    if (ids.length === 0) return;

    setLoading(true);
    likeAPI.bulkStatus(type, ids)
      .then(({ data }) => setLikeMap(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, list.length]);

  const toggle = useCallback(async (entityId) => {
    try {
      const { data } = await likeAPI.toggle(type, entityId);
      setLikeMap(prev => ({
        ...prev,
        [String(entityId)]: { liked: data.liked, count: data.count }
      }));
      return data;
    } catch (e) {
      console.error('Like toggle failed', e);
    }
  }, [type]);

  const get = useCallback((entityId) => {
    return likeMap[String(entityId)] || { liked: false, count: 0 };
  }, [likeMap]);

  return { likeMap, toggle, get, loading };
}