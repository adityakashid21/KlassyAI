import { useState, useEffect, useCallback } from 'react';
import { CacheManager } from '../services/cache';

/**
 * Custom hook for optimized data fetching with caching
 * Reduces API calls by checking cache first
 * 
 * Usage:
 * const { data, loading, error, refresh } = useOptimizedData(
 *   () => fetchFromSupabase(),
 *   'my_cache_key',
 *   CACHE_DURATION.ATTENDANCE
 * );
 */

interface UseOptimizedDataResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useOptimizedData<T>(
    fetchFunction: () => Promise<T>,
    cacheKey: string,
    cacheDuration: number,
    enabled: boolean = true
): UseOptimizedDataResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = useCallback(async (useCache: boolean = true) => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Try cache first if enabled
            if (useCache) {
                const cached = await CacheManager.get<T>(cacheKey);
                if (cached !== null) {
                    setData(cached);
                    setLoading(false);
                    console.log(`✅ Loaded from cache: ${cacheKey}`);
                    return;
                }
            }

            // Fetch from API
            console.log(`🔄 Fetching from API: ${cacheKey}`);
            const freshData = await fetchFunction();

            setData(freshData);

            // Cache for future use
            await CacheManager.set(cacheKey, freshData, cacheDuration);
            console.log(`💾 Cached: ${cacheKey}`);
        } catch (err) {
            setError(err as Error);
            console.error(`❌ Error loading ${cacheKey}:`, err);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, cacheKey, cacheDuration, enabled]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Refresh function (bypasses cache)
    const refresh = useCallback(async () => {
        await loadData(false);
    }, [loadData]);

    return { data, loading, error, refresh };
}

/**
 * Hook for debouncing values (useful for search)
 * 
 * Usage:
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for throttling function calls
 * 
 * Usage:
 * const throttledFn = useThrottle(myFunction, 1000);
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const [lastRun, setLastRun] = useState(Date.now());

    return useCallback(
        ((...args) => {
            const now = Date.now();
            if (now - lastRun >= delay) {
                setLastRun(now);
                return callback(...args);
            }
        }) as T,
        [callback, delay, lastRun]
    );
}
