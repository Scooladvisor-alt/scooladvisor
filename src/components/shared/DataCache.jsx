import { useEffect, useState, useCallback, useRef } from "react";

// Cache en mémoire avec TTL
const cache = new Map();
const CACHE_TTL = {
  schools: 5 * 60 * 1000,      // 5 minutes
  teachers: 5 * 60 * 1000,     // 5 minutes
  reviews: 2 * 60 * 1000,      // 2 minutes
  user: 10 * 60 * 1000,        // 10 minutes
  default: 3 * 60 * 1000       // 3 minutes
};

export const getCacheKey = (entity, params = {}) => {
  return `${entity}:${JSON.stringify(params)}`;
};

export const getFromCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

export const setInCache = (key, data, ttlKey = 'default') => {
  const ttl = CACHE_TTL[ttlKey] || CACHE_TTL.default;
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
};

export const invalidateCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
};

export const clearCache = () => {
  cache.clear();
};

// Hook pour data fetching avec cache
export const useCachedData = (fetchFn, cacheKey, ttlKey = 'default', dependencies = []) => {
  const [data, setData] = useState(() => getFromCache(cacheKey));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async (skipCache = false) => {
    if (!skipCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setInCache(cacheKey, result, ttlKey);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
      throw err;
    }
  }, [fetchFn, cacheKey, ttlKey]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Si pas de données en cache, fetch
    if (!data) {
      refetch();
    }

    return () => {
      mountedRef.current = false;
    };
  }, dependencies);

  return { data, loading, error, refetch };
};

// Préchargement en arrière-plan
export const prefetchData = async (fetchFn, cacheKey, ttlKey = 'default') => {
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const prefetch = async () => {
    try {
      const result = await fetchFn();
      setInCache(cacheKey, result, ttlKey);
      return result;
    } catch (err) {
      console.warn('Prefetch failed:', err);
      return null;
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => prefetch(), { timeout: 3000 });
  } else {
    setTimeout(prefetch, 500);
  }
};