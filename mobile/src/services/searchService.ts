import offlineDB from './offlineDatabase';
import apiClient from './api-client';

export interface SearchFilters {
  type?: ('messages' | 'files' | 'assignments' | 'courses' | 'users')[];
  dateRange?: { start: Date; end: Date };
  courseId?: string;
  channelId?: string;
  authorId?: string;
  hasAttachments?: boolean;
}

export interface SearchResult {
  id: string;
  type: 'message' | 'file' | 'assignment' | 'course' | 'user';
  title: string;
  content: string;
  snippet: string;
  highlights: string[];
  metadata: {
    author?: string;
    date: Date;
    course?: string;
    channel?: string;
    thumbnail?: string;
    size?: number;
    mimeType?: string;
  };
  relevance: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'autocomplete';
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultCount: number;
}

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 20;
const MAX_SUGGESTIONS = 10;

class SearchService {
  private searchIndex: Map<string, Set<string>> = new Map();
  private recentSearches: SearchHistory[] = [];

  /**
   * Initialize search service
   */
  async initialize(): Promise<void> {
    await this.loadSearchHistory();
    console.log('[Search] Service initialized');
  }

  /**
   * Perform full-text search
   */
  async search(query: string, filters?: SearchFilters, options: {
    limit?: number;
    offset?: number;
    offlineOnly?: boolean;
  } = {}): Promise<{
    results: SearchResult[];
    total: number;
    hasMore: boolean;
  }> {
    const { limit = 20, offset = 0, offlineOnly = false } = options;

    // Save to history
    await this.addToHistory(query);

    // Try online search first
    if (!offlineOnly && navigator.onLine !== false) {
      try {
        const response = await apiClient.get<any>('/api/search', {
          params: {
            q: query,
            ...filters,
            limit,
            offset,
          },
        });

        return {
          results: this.processResults(response.results),
          total: response.total,
          hasMore: response.hasMore,
        };
      } catch (error) {
        console.log('[Search] Online search failed, falling back to offline');
      }
    }

    // Offline search
    const offlineResults = await this.searchOffline(query, filters, limit, offset);
    return offlineResults;
  }

  /**
   * Search in offline data
   */
  private async searchOffline(
    query: string,
    filters?: SearchFilters,
    limit = 20,
    offset = 0
  ): Promise<{ results: SearchResult[]; total: number; hasMore: boolean }> {
    const results: SearchResult[] = [];
    const searchTerms = this.tokenize(query);

    // Search cached messages
    if (!filters?.type || filters.type.includes('messages')) {
      const messages = await this.searchOfflineMessages(searchTerms, filters);
      results.push(...messages);
    }

    // Search cached files
    if (!filters?.type || filters.type.includes('files')) {
      const files = await this.searchOfflineFiles(searchTerms, filters);
      results.push(...files);
    }

    // Search cached courses
    if (!filters?.type || filters.type.includes('courses')) {
      const courses = await this.searchOfflineCourses(searchTerms, filters);
      results.push(...courses);
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply pagination
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Search offline messages
   */
  private async searchOfflineMessages(
    terms: string[],
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    // This would search through cached messages
    // For now, return empty
    return [];
  }

  /**
   * Search offline files
   */
  private async searchOfflineFiles(
    terms: string[],
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    // This would search through cached file metadata
    return [];
  }

  /**
   * Search offline courses
   */
  private async searchOfflineCourses(
    terms: string[],
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Get cached courses
    const courses = await offlineDB.getCache<any[]>('courses');
    if (!courses) return results;

    for (const course of courses) {
      const relevance = this.calculateRelevance(terms, [
        course.name,
        course.description,
        course.code,
      ]);

      if (relevance > 0) {
        results.push({
          id: course.id,
          type: 'course',
          title: course.name,
          content: course.description || '',
          snippet: this.generateSnippet(course.description || '', terms),
          highlights: terms,
          metadata: {
            author: course.instructor?.name,
            date: new Date(course.createdAt),
          },
          relevance,
        });
      }
    }

    return results;
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(partial: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    if (!partial || partial.length < 2) {
      // Return recent searches
      return this.recentSearches.slice(0, 5).map(h => ({
        text: h.query,
        type: 'recent',
      }));
    }

    // Add from recent searches that match
    const matchingRecent = this.recentSearches
      .filter(h => h.query.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, 3)
      .map(h => ({
        text: h.query,
        type: 'recent' as const,
      }));

    suggestions.push(...matchingRecent);

    // Try to get autocomplete from server
    try {
      const response = await apiClient.get<any>('/api/search/suggestions', {
        params: { q: partial, limit: MAX_SUGGESTIONS - suggestions.length },
      });

      const serverSuggestions = response.map((s: string) => ({
        text: s,
        type: 'autocomplete' as const,
      }));

      suggestions.push(...serverSuggestions);
    } catch (error) {
      // Use local autocomplete
      const localSuggestions = this.generateLocalSuggestions(partial);
      suggestions.push(...localSuggestions);
    }

    return suggestions.slice(0, MAX_SUGGESTIONS);
  }

  /**
   * Generate local suggestions
   */
  private generateLocalSuggestions(partial: string): SearchSuggestion[] {
    // Common search terms
    const commonTerms = [
      'assignment',
      'homework',
      'exam',
      'grade',
      'syllabus',
      'schedule',
      'attendance',
      'project',
      'presentation',
      'quiz',
    ];

    return commonTerms
      .filter(term => term.toLowerCase().includes(partial.toLowerCase()))
      .map(term => ({
        text: term,
        type: 'autocomplete' as const,
      }));
  }

  /**
   * Get search history
   */
  async getHistory(): Promise<SearchHistory[]> {
    return this.recentSearches;
  }

  /**
   * Clear search history
   */
  async clearHistory(): Promise<void> {
    this.recentSearches = [];
    await offlineDB.setUserData(SEARCH_HISTORY_KEY, []);
  }

  /**
   * Add to search history
   */
  private async addToHistory(query: string): Promise<void> {
    if (!query.trim()) return;

    // Remove if exists
    this.recentSearches = this.recentSearches.filter(h => h.query !== query);

    // Add to front
    this.recentSearches.unshift({
      query: query.trim(),
      timestamp: new Date(),
      resultCount: 0,
    });

    // Trim to max
    if (this.recentSearches.length > MAX_HISTORY_ITEMS) {
      this.recentSearches = this.recentSearches.slice(0, MAX_HISTORY_ITEMS);
    }

    // Save
    await offlineDB.setUserData(SEARCH_HISTORY_KEY, this.recentSearches);
  }

  /**
   * Load search history
   */
  private async loadSearchHistory(): Promise<void> {
    const history = await offlineDB.getUserData<SearchHistory[]>(SEARCH_HISTORY_KEY);
    if (history) {
      this.recentSearches = history;
    }
  }

  /**
   * Index content for offline search
   */
  async indexContent(type: string, id: string, content: string): Promise<void> {
    const terms = this.tokenize(content);
    
    for (const term of terms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(`${type}:${id}`);
    }
  }

  /**
   * Tokenize search query
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(terms: string[], fields: (string | undefined)[]): number {
    let score = 0;
    const fieldText = fields.filter(Boolean).join(' ').toLowerCase();

    for (const term of terms) {
      // Exact match in title (first field) scores higher
      if (fields[0]?.toLowerCase().includes(term)) {
        score += 10;
      }
      
      // Match in any field
      if (fieldText.includes(term)) {
        score += 5;
      }

      // Word boundary match
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(fieldText)) {
        score += 3;
      }
    }

    return score;
  }

  /**
   * Generate search snippet
   */
  private generateSnippet(text: string, terms: string[]): string {
    if (!text) return '';

    const lowerText = text.toLowerCase();
    let bestIndex = 0;
    let bestScore = 0;

    // Find best snippet position
    for (let i = 0; i < lowerText.length - 100; i += 50) {
      const snippet = lowerText.slice(i, i + 200);
      let score = 0;

      for (const term of terms) {
        if (snippet.includes(term)) score++;
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    // Generate snippet
    let snippet = text.slice(bestIndex, bestIndex + 200);
    
    // Add ellipsis
    if (bestIndex > 0) snippet = '...' + snippet;
    if (bestIndex + 200 < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Process server results
   */
  private processResults(results: any[]): SearchResult[] {
    return results.map(r => ({
      ...r,
      metadata: {
        ...r.metadata,
        date: new Date(r.metadata.date),
      },
    }));
  }

  /**
   * Advanced filter builder
   */
  buildFilters(params: {
    types?: string[];
    fromDate?: Date;
    toDate?: Date;
    course?: string;
    hasFiles?: boolean;
  }): SearchFilters {
    return {
      type: params.types as SearchFilters['type'],
      dateRange: params.fromDate && params.toDate ? {
        start: params.fromDate,
        end: params.toDate,
      } : undefined,
      courseId: params.course,
      hasAttachments: params.hasFiles,
    };
  }
}

// Export singleton
export const searchService = new SearchService();
export default searchService;
