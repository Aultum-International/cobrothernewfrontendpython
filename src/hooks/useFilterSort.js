import { useState, useMemo, useCallback } from 'react';
import { asArray } from '../utils/asArray';

/**
 * Universal filter/sort/paginate hook.
 * @param {Array}  items        - full unfiltered array
 * @param {Object} filterConfig - { searchFields, priceField, categoryField, dateField }
 * @param {number} pageSize     - items per page (default 20)
 */
export function useFilterSort(items = [], filterConfig = {}, pageSize = 20) {
  const safeItems = asArray(items);
  const {
    searchFields = [],
    priceField   = null,
    categoryField = null,
    dateField    = 'createdAt',
  } = filterConfig;

  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('');
  const [minPrice,    setMinPrice]    = useState('');
  const [maxPrice,    setMaxPrice]    = useState('');
  const [sortBy,      setSortBy]      = useState('newest');
  const [page,        setPage]        = useState(1);

  const resetPage = useCallback(() => setPage(1), []);

  const handleSearch   = useCallback(v => { setSearch(v);   resetPage(); }, [resetPage]);
  const handleCategory = useCallback(v => { setCategory(v); resetPage(); }, [resetPage]);
  const handleMinPrice = useCallback(v => { setMinPrice(v); resetPage(); }, [resetPage]);
  const handleMaxPrice = useCallback(v => { setMaxPrice(v); resetPage(); }, [resetPage]);
  const handleSort     = useCallback(v => { setSortBy(v);   resetPage(); }, [resetPage]);

  const clearAll = useCallback(() => {
    setSearch(''); setCategory('');
    setMinPrice(''); setMaxPrice('');
    setSortBy('newest'); setPage(1);
  }, []);

  const activeFilterCount = [
    search.trim(), category, minPrice, maxPrice
  ].filter(Boolean).length;

  const get = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  };

  const filtered = useMemo(() => {
    let result = [...safeItems];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const val = get(item, field);
          return val && String(val).toLowerCase().includes(q);
        })
      );
    }

    if (category) {
      result = result.filter(item => {
        const val = get(item, categoryField);
        return val && String(val).toUpperCase() === category.toUpperCase();
      });
    }

    if (priceField) {
      if (minPrice !== '') {
        result = result.filter(item => {
          const p = Number(get(item, priceField) || 0);
          return p >= Number(minPrice);
        });
      }
      if (maxPrice !== '') {
        result = result.filter(item => {
          const p = Number(get(item, priceField) || 0);
          return p <= Number(maxPrice);
        });
      }
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(get(b, dateField) || 0) - new Date(get(a, dateField) || 0);
        case 'oldest':
          return new Date(get(a, dateField) || 0) - new Date(get(b, dateField) || 0);
        case 'price_asc':
          return Number(get(a, priceField) || 0) - Number(get(b, priceField) || 0);
        case 'price_desc':
          return Number(get(b, priceField) || 0) - Number(get(a, priceField) || 0);
        case 'most_liked':
          return (b.likeCount || 0) - (a.likeCount || 0);
        case 'most_viewed':
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [safeItems, search, category, minPrice, maxPrice, sortBy,
      searchFields, priceField, categoryField, dateField]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    paginated,
    filtered,
    totalCount: filtered.length,
    search, category, minPrice, maxPrice, sortBy,
    activeFilterCount,
    handleSearch, handleCategory, handleMinPrice, handleMaxPrice, handleSort,
    clearAll,
    page: safePage, totalPages, setPage,
  };
}
