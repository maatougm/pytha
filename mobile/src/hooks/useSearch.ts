import { useState, useEffect, useCallback, useRef } from 'react';
import { searchService, SearchResult, SearchFilters, SearchSuggestion, SearchHistory } from '@/src/services/searchService';

export interface SearchState {
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  history: SearchHistory[];
  isLoading: boolean;
  hasMore: boolean;
  total: number;
  error: string | null;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  search: (query?: string, filters?: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  getSuggestions: (partial: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  clearResults: () => void;
}

/**
 * Hook for advanced search functionality
 */
export function useSearch(): SearchState & SearchActions {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    history: [],
    isLoading: false,
    hasMore: false,
    total: 0,
    error: null,
  });

  const offsetRef = useRef<number>(0);
  const currentFiltersRef = useRef<SearchFilters | undefined>(undefined);

  // Initialize search service
  useEffect(() => {
    searchService.initialize();
    loadHistory();
  }, []);

  /**
   * Load search history
   */
  const loadHistory = async () => {
    const history = await searchService.getHistory();
    setState(prev => ({ ...prev, history }));
  };

  /**
   * Set search query
   */
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    
    // Get suggestions if query is not empty
    if (query.length >= 2) {
      getSuggestions(query);
    } else {
      setState(prev => ({ ...prev, suggestions: [] }));
    }
  }, []);

  /**
   * Perform search
   */
  const search = useCallback(async (query?: string, filters?: SearchFilters) => {
    const searchQuery = query || state.query;
    if (!searchQuery.trim()) return;

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      suggestions: [],
    }));

    currentFiltersRef.current = filters;
    offsetRef.current = 0;

    try {
      const response = await searchService.search(searchQuery, filters, {
        limit: 20,
        offset: 0,
      });

      setState(prev => ({
        ...prev,
        results: response.results,
        total: response.total,
        hasMore: response.hasMore,
        isLoading: false,
      }));

      // Refresh history
      await loadHistory();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
    }
  }, [state.query]);

  /**
   * Load more results
   */
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;

    offsetRef.current += 20;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await searchService.search(state.query, currentFiltersRef.current, {
        limit: 20,
        offset: offsetRef.current,
      });

      setState(prev => ({
        ...prev,
        results: [...prev.results, ...response.results],
        hasMore: response.hasMore,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load more',
      }));
    }
  }, [state.hasMore, state.isLoading, state.query]);

  /**
   * Get search suggestions
   */
  const getSuggestions = useCallback(async (partial: string) => {
    if (partial.length < 2) {
      setState(prev => ({ ...prev, suggestions: [] }));
      return;
    }

    try {
      const suggestions = await searchService.getSuggestions(partial);
      setState(prev => ({ ...prev, suggestions }));
    } catch (error) {
      console.error('[useSearch] Failed to get suggestions:', error);
    }
  }, []);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(async () => {
    await searchService.clearHistory();
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      total: 0,
      hasMore: false,
      error: null,
    }));
    offsetRef.current = 0;
  }, []);

  return {
    ...state,
    setQuery,
    search,
    loadMore,
    getSuggestions,
    clearHistory,
    clearResults,
  };
}

/**
 * Hook for search with debounced suggestions
 */
export function useDebouncedSearch(debounceMs = 300) {
  const search = useSearch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSetQuery = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      search.setQuery(query);
    }, debounceMs);
  }, [search, debounceMs]);

  return {
    ...search,
    setQuery: debouncedSetQuery,
  };
}

/**
 * Hook for filtered search
 */
export function useFilteredSearch(initialFilters?: SearchFilters) {
  const search = useSearch();
  const [filters, setFilters] = useState<SearchFilters | undefined>(initialFilters);

  const searchWithFilters = useCallback(
    (query?: string) => search.search(query, filters),
    [search, filters]
  );

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(undefined);
  }, []);

  return {
    ...search,
    filters,
    updateFilters,
    clearFilters,
    search: searchWithFilters,
  };
}

export default useSearch;
