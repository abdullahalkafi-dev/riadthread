import type { ApiEnvelope, ProductCard } from '@/types/api';
import { baseApi } from '../baseApi';

/** Product suggestions for the search panel. Empty text returns the newest styles. */
export const searchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchSuggestions: build.query<ProductCard[], { q: string; limit?: number }>({
      query: ({ q, limit = 9 }) => ({ url: '/products', params: { ...(q ? { q } : { sort: 'newest' }), limit } }),
      transformResponse: (res: ApiEnvelope<ProductCard[]>) => res.data,
    }),
  }),
});

export const { useSearchSuggestionsQuery } = searchApi;
